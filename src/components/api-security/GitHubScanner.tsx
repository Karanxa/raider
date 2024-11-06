import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const GitHubScanner = () => {
  const [githubToken, setGithubToken] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [totalRepos, setTotalRepos] = useState(0);
  const [scannedRepos, setScannedRepos] = useState(0);

  const handleScan = async () => {
    if (!githubToken) {
      toast.error("Please enter your GitHub token");
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setTimeRemaining(null);
    setTotalRepos(0);
    setScannedRepos(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Please sign in to scan repositories");
        return;
      }

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

      const { error } = await supabase.functions.invoke('scan-github-repos', {
        body: { 
          githubToken,
          userId: session.user.id 
        }
      });

      if (error) throw error;
      
      toast.success("GitHub scan completed. Your findings will appear in the API Findings dashboard shortly.");
      
      // Clear the token after successful scan
      setGithubToken("");
      supabase.removeChannel(channel);
    } catch (error) {
      console.error('Error scanning GitHub repos:', error);
      toast.error("Failed to scan GitHub repositories. Please check your token and try again.");
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
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="github-token" className="text-sm font-medium">
              GitHub Personal Access Token
            </label>
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

          {isScanning && (
            <div className="space-y-2">
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

          <Button onClick={handleScan} disabled={isScanning}>
            {isScanning ? "Scanning..." : "Start Scan"}
          </Button>
        </div>
      </Card>
    </div>
  );
};