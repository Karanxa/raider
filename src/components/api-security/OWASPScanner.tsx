import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { OWASPResults } from "@/components/security/OWASPResults";
import { Loader2 } from "lucide-react";

export const OWASPScanner = () => {
  const [targetUrl, setTargetUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
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

    // Basic URL validation
    try {
      new URL(targetUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setScanning(true);
    setProgress(0);
    setShowResults(false);

    try {
      // Start progress animation
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 500);

      const { data, error } = await supabase.functions.invoke('owasp-scan', {
        body: { 
          url: targetUrl,
          userId: session.user.id
        }
      });

      clearInterval(interval);

      if (error) throw error;

      if (data?.success) {
        setProgress(100);
        toast.success(data.message || "OWASP scan completed successfully");
        setShowResults(true);
      } else {
        throw new Error("Scan failed to complete");
      }
    } catch (error: any) {
      console.error('OWASP scan error:', error);
      toast.error(error.message || "Failed to complete OWASP scan");
    } finally {
      setScanning(false);
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
              disabled={scanning}
            />
          </div>

          <Button 
            onClick={handleScan} 
            disabled={scanning}
            className="w-full"
          >
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              "Start OWASP Scan"
            )}
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

      {showResults && <OWASPResults targetUrl={targetUrl} />}
    </div>
  );
};