import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const GitHubScanner = () => {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const session = useSession();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Please login to continue");
      return;
    }

    setIsScanning(true);

    try {
      const { error } = await supabase.functions.invoke('security-scanner', {
        body: {
          operation: 'scan-github-repos',
          repositoryUrl,
          userId: session.user.id
        }
      });

      if (error) throw error;

      toast.success("GitHub repository scan initiated successfully");
      setRepositoryUrl("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to initiate GitHub repository scan");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleScan} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repositoryUrl">GitHub Repository URL</Label>
            <Input
              id="repositoryUrl"
              placeholder="https://github.com/owner/repository"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isScanning || !repositoryUrl}
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning Repository...
              </>
            ) : (
              'Scan Repository'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};