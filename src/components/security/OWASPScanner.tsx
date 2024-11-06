import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { OWASPResults } from "./OWASPResults";

export const OWASPScanner = () => {
  const [targetUrl, setTargetUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const session = useSession();

  const handleScan = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to use the scanner");
      return;
    }

    if (!targetUrl) {
      toast.error("Please enter a target URL");
      return;
    }

    setScanning(true);
    setProgress(0);

    try {
      const channel = supabase
        .channel('scan-progress')
        .on('broadcast', { event: 'scan-progress' }, (payload) => {
          setProgress(payload.payload.progress);
        })
        .subscribe();

      const { error } = await supabase.functions.invoke('owasp-scan', {
        body: { 
          url: targetUrl,
          userId: session.user.id
        }
      });

      if (error) throw error;

      toast.success("OWASP scan completed successfully");
      channel.unsubscribe();
    } catch (error: any) {
      console.error('OWASP scan error:', error);
      toast.error(error.message || "Failed to complete OWASP scan");
    } finally {
      setScanning(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-url">Target URL</Label>
            <Input
              id="target-url"
              placeholder="https://example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleScan} 
            disabled={scanning}
            className="w-full"
          >
            {scanning ? "Scanning..." : "Start OWASP Scan"}
          </Button>

          {scanning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Scanning for OWASP Top 10 vulnerabilities...
              </p>
            </div>
          )}
        </div>
      </Card>

      <OWASPResults targetUrl={targetUrl} />
    </div>
  );
};