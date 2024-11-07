import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const GitHubScanner = () => {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const session = useSession();

  const validateGitHubUrl = (url: string) => {
    const githubPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/;
    return githubPattern.test(url);
  };

  const handleScan = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to use the scanner");
      return;
    }

    if (!repositoryUrl) {
      toast.error("Please enter a repository URL");
      return;
    }

    if (!validateGitHubUrl(repositoryUrl)) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    setScanning(true);
    setProgress(0);

    try {
      const { error } = await supabase.functions.invoke('scan-github-repos', {
        body: { 
          repository_url: repositoryUrl,
          userId: session.user.id
        }
      });

      if (error) throw error;

      toast.success("GitHub repository scan completed successfully");
      setProgress(100);
      setRepositoryUrl("");
    } catch (error: any) {
      console.error('GitHub scan error:', error);
      toast.error(error.message || "Failed to scan GitHub repository");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repository-url">GitHub Repository URL</Label>
            <Input
              id="repository-url"
              placeholder="https://github.com/username/repository"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              disabled={scanning}
            />
            <p className="text-sm text-muted-foreground">
              Enter the URL of a public GitHub repository to scan for API endpoints
            </p>
          </div>

          <Button 
            onClick={handleScan} 
            disabled={scanning}
            className="w-full"
          >
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning Repository...
              </>
            ) : (
              "Start GitHub Scan"
            )}
          </Button>

          {scanning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Scanning repository for API endpoints...
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};