import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const GitHubScan = () => {
  const [token, setToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const session = useSession();

  const handleScan = async () => {
    if (!token) {
      toast.error("Please enter your GitHub token");
      return;
    }

    setScanning(true);
    try {
      const { error } = await supabase.functions.invoke('scan-github-repos', {
        body: { 
          githubToken: token,
          userId: session?.user?.id
        }
      });

      if (error) throw error;
      
      toast.success("GitHub repositories scan initiated successfully");
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to scan repositories: " + error.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">GitHub Repository Scanner</h2>
        <p className="text-muted-foreground mb-6">
          Scan your GitHub repositories to discover API endpoints and analyze them for potential PII handling.
        </p>
        
        <div className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter your GitHub personal access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Token needs repo and read:user permissions
            </p>
          </div>
          
          <Button 
            onClick={handleScan} 
            disabled={scanning || !token}
            className="w-full"
          >
            {scanning ? "Scanning..." : "Start Scan"}
          </Button>
        </div>
      </Card>
    </div>
  );
};