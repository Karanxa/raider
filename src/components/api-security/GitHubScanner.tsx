import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

    if (includePrivateRepos && !githubToken) {
      toast.error("GitHub token is required for scanning private repositories");
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
          githubToken: includePrivateRepos ? githubToken : null,
          userId: session.user.id,
          specificRepo: scanType === 'specific' ? specificRepo : null,
          orgName: scanType === 'org' ? orgName : null,
          includePrivateRepos,
          scanType
        }
      });

      if (error) throw error;
      
      toast.success("GitHub scan completed successfully");
      
      setGithubToken("");
      setSpecificRepo("");
      setOrgName("");
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
        <h2 className="text-2xl font-bold tracking-tight">GitHub API Scanner</h2>
        <p className="text-muted-foreground">
          Scan your GitHub repositories to discover API endpoints and analyze their security.
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Scan Public Repositories</TabsTrigger>
            <TabsTrigger value="org">Scan Organization</TabsTrigger>
            <TabsTrigger value="specific">Scan Specific Repository</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="private-repos"
              checked={includePrivateRepos}
              onCheckedChange={setIncludePrivateRepos}
            />
            <Label htmlFor="private-repos">Include Private Repositories</Label>
          </div>

          {includePrivateRepos && (
            <div className="space-y-2 mb-4">
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

          <TabsContent value="all" className="space-y-4">
            <Button onClick={() => handleScan('all')} disabled={isScanning}>
              {isScanning ? "Scanning..." : "Start Scan"}
            </Button>
          </TabsContent>

          <TabsContent value="org" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                type="text"
                placeholder="organization-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the GitHub organization name (e.g., microsoft)
              </p>
            </div>
            <Button onClick={() => handleScan('org')} disabled={isScanning}>
              {isScanning ? "Scanning..." : "Start Scan"}
            </Button>
          </TabsContent>

          <TabsContent value="specific" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repository Name</Label>
              <Input
                id="repo-name"
                type="text"
                placeholder="owner/repository"
                value={specificRepo}
                onChange={(e) => setSpecificRepo(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the repository name in the format owner/repository (e.g., octocat/Hello-World)
              </p>
            </div>
            <Button onClick={() => handleScan('specific')} disabled={isScanning}>
              {isScanning ? "Scanning..." : "Start Scan"}
            </Button>
          </TabsContent>
        </Tabs>

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