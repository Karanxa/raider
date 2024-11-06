import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@supabase/auth-helpers-react";

export const GitHubScanner = () => {
  const [githubToken, setGithubToken] = useState("");
  const [specificRepo, setSpecificRepo] = useState("");
  const [orgName, setOrgName] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [totalRepos, setTotalRepos] = useState(0);
  const [scannedRepos, setScannedRepos] = useState(0);
  const [includePrivateRepos, setIncludePrivateRepos] = useState(false);
  const session = useSession();

  const handleScan = async (scanType: 'all' | 'specific' | 'org') => {
    if (!session?.user?.id) {
      toast.error("Please sign in to scan repositories");
      return;
    }

    if (scanType === 'specific' && !specificRepo) {
      toast.error("Please enter a repository name");
      return;
    }

    if (scanType === 'org' && !orgName) {
      toast.error("Please enter an organization name");
      return;
    }

    if (includePrivateRepos && !githubToken) {
      toast.error("GitHub token is required for scanning private repositories");
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setTimeRemaining(null);
    setTotalRepos(0);
    setScannedRepos(0);

    try {
      const channel = supabase
        .channel('scan-progress')
        .on('broadcast', { event: 'scan-progress' }, (payload) => {
          const { progress, timeRemaining, totalRepos, scannedRepos } = payload.payload;
          setProgress(progress);
          setTimeRemaining(timeRemaining);
          setTotalRepos(totalRepos);
          setScannedRepos(scannedRepos);
        })
        .subscribe();

      const { data, error } = await supabase.functions.invoke('scan-github-repos', {
        body: {
          githubToken,
          userId: session.user.id,
          specificRepo,
          orgName,
          includePrivateRepos,
          scanType
        }
      });

      if (error) throw error;

      toast.success("GitHub scan completed successfully");
      channel.unsubscribe();
    } catch (error: any) {
      console.error('Error scanning GitHub repos:', error);
      toast.error(error.message || "Failed to scan GitHub repositories");
    } finally {
      setIsScanning(false);
      setProgress(0);
      setTimeRemaining(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">GitHub Repository Scanner</h2>
        <p className="text-muted-foreground">
          Enter a GitHub repository to scan for API endpoints and analyze their security.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-name">Repository Name</Label>
            <Input
              id="repo-name"
              type="text"
              placeholder="e.g., octocat/Hello-World"
              value={specificRepo}
              onChange={(e) => setSpecificRepo(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Enter the repository name in the format owner/repository (e.g., octocat/Hello-World)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private-repos"
              checked={includePrivateRepos}
              onCheckedChange={setIncludePrivateRepos}
            />
            <Label htmlFor="private-repos">Include Private Repository</Label>
          </div>

          {includePrivateRepos && (
            <div className="space-y-2">
              <Label htmlFor="github-token">GitHub Personal Access Token</Label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Token requires 'repo' scope. Create one in GitHub Settings → Developer settings → Personal access tokens
              </p>
            </div>
          )}

          <Button 
            onClick={() => handleScan('specific')} 
            disabled={isScanning}
            className="w-full"
          >
            {isScanning ? "Scanning..." : "Start Scan"}
          </Button>
        </div>

        {isScanning && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span>Scanning Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {scannedRepos} of {totalRepos} repositories scanned
              </span>
              {timeRemaining && (
                <span>Estimated time remaining: {timeRemaining}</span>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
