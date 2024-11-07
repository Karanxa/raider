import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

export const GitHubScanner = () => {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const session = useSession();

  const handleScan = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to use the scanner");
      return;
    }

    if (!repositoryUrl) {
      toast.error("Please enter a repository URL");
      return;
    }

    setScanning(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('scan-github-repos', {
        body: { 
          repository_url: repositoryUrl,
          userId: session.user.id
        }
      });

      if (error) throw error;

      toast.success("GitHub repository scan completed successfully");
      setProgress(100);
    } catch (error: any) {
      console.error('GitHub scan error:', error);
      toast.error(error.message || "Failed to scan repository");
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
              placeholder="https://github.com/owner/repository"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleScan} 
            disabled={scanning}
            className="w-full"
          >
            {scanning ? "Scanning..." : "Start GitHub Scan"}
          </Button>

          {scanning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Scanning repository for API endpoints and security issues...
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};