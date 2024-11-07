import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

export const OWASPScanButton = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verboseOutput, setVerboseOutput] = useState<string[]>([]);
  const session = useSession();

  const startScan = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to use the scanner");
      return;
    }

    setScanning(true);
    setProgress(0);
    setVerboseOutput([]);

    try {
      // Subscribe to realtime updates for scan progress
      const channel = supabase
        .channel('scan-progress')
        .on('broadcast', { event: 'scan-progress' }, (payload) => {
          setProgress(payload.payload.progress);
          if (payload.payload.message) {
            setVerboseOutput(prev => [...prev, payload.payload.message]);
          }
        })
        .subscribe();

      const { error } = await supabase.functions.invoke('owasp-scan', {
        body: { 
          userId: session.user.id,
          verbose: true
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
      setProgress(100);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={startScan} 
        disabled={scanning}
        className="w-full"
      >
        {scanning ? "Scanning..." : "Start OWASP Scan"}
      </Button>

      {scanning && (
        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Scanning APIs for OWASP Top 10 vulnerabilities...
          </p>
        </div>
      )}

      {verboseOutput.length > 0 && (
        <ScrollArea className="h-[200px] border rounded-md p-4">
          <div className="space-y-2">
            {verboseOutput.map((message, index) => (
              <p key={index} className="text-sm font-mono">
                {message}
              </p>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};