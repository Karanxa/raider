import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from '@supabase/auth-helpers-react';
import { Progress } from "@/components/ui/progress";

export const GitHubScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [githubToken, setGithubToken] = useState("");
  const [specificRepo, setSpecificRepo] = useState("");
  const [orgName, setOrgName] = useState("");
  const [includePrivateRepos, setIncludePrivateRepos] = useState(false);
  const session = useSession();

  const startScan = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to use the GitHub scanner");
      return;
    }

    if (!githubToken) {
      toast.error("Please provide a GitHub token");
      return;
    }

    setScanning(true);
    setProgress(0);

    try {
      const scanType = specificRepo ? 'specific' : orgName ? 'organization' : 'user';
      
      const { error } = await supabase.functions.invoke('scan-github-repos', {
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

      const channel = supabase
        .channel('scan-progress')
        .on('broadcast', { event: 'scan-progress' }, (payload) => {
          setProgress(payload.payload.progress || 0);
          
          if (payload.payload.progress === 100) {
            toast.success(`Scan completed! Found ${payload.payload.totalFindings} API endpoints`);
            setScanning(false);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };

    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(`Scan failed: ${error.message}`);
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">GitHub API Scanner</h2>
        <p className="text-muted-foreground">
          Scan GitHub repositories to discover API endpoints and potential security issues.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="githubToken">GitHub Personal Access Token</Label>
            <Input
              id="githubToken"
              type="password"
              placeholder="ghp_..."
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Required. Token needs repo access permissions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specificRepo">Specific Repository (Optional)</Label>
            <Input
              id="specificRepo"
              placeholder="owner/repo"
              value={specificRepo}
              onChange={(e) => setSpecificRepo(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Format: owner/repo (e.g., octocat/Hello-World)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name (Optional)</Label>
            <Input
              id="orgName"
              placeholder="organization"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!!specificRepo}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="privateRepos"
              checked={includePrivateRepos}
              onCheckedChange={(checked) => setIncludePrivateRepos(!!checked)}
            />
            <Label htmlFor="privateRepos">Include private repositories</Label>
          </div>

          <Button 
            onClick={startScan} 
            disabled={scanning || !githubToken}
            className="w-full"
          >
            {scanning ? 'Scanning...' : 'Start Scan'}
          </Button>

          {scanning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {progress.toFixed(1)}% complete
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};