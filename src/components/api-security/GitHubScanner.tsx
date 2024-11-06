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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScanProgress } from "./github-scanner/ScanProgress";
import { RepoScanForm } from "./github-scanner/RepoScanForm";
import { OrgScanForm } from "./github-scanner/OrgScanForm";

export const GitHubScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [totalRepos, setTotalRepos] = useState(0);
  const [scannedRepos, setScannedRepos] = useState(0);
  const session = useSession();

  const handleScan = async (scanType: 'repo' | 'org', params: any) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to scan repositories");
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
          userId: session.user.id,
          scanType,
          ...params
        }
      });

      if (error) {
        let errorMessage = error.message;
        try {
          const errorBody = JSON.parse(error.message);
          if (errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          // If parsing fails, use the original error message
        }
        throw new Error(errorMessage);
      }

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
          Scan GitHub repositories or organizations for API endpoints and analyze their security.
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="repo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="repo">Repository Scan</TabsTrigger>
            <TabsTrigger value="org">Organization Scan</TabsTrigger>
          </TabsList>

          <TabsContent value="repo">
            <RepoScanForm 
              onScan={(params) => handleScan('repo', params)} 
              isScanning={isScanning} 
            />
          </TabsContent>

          <TabsContent value="org">
            <OrgScanForm 
              onScan={(params) => handleScan('org', params)} 
              isScanning={isScanning} 
            />
          </TabsContent>
        </Tabs>

        {isScanning && (
          <ScanProgress
            progress={progress}
            timeRemaining={timeRemaining}
            scannedRepos={scannedRepos}
            totalRepos={totalRepos}
          />
        )}
      </Card>
    </div>
  );
};