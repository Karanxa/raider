import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { NotebookInterface } from "./NotebookInterface";

export const PerformFineTuning = () => {
  const [colabApiKey, setColabApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const session = useSession();
  const { saveApiKey, getApiKey } = useApiKeys();
  const [script, setScript] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("Please login to continue");
      return;
    }

    if (!colabApiKey) {
      toast.error("Please enter your Google Colab API key");
      return;
    }

    try {
      // Store API key locally
      saveApiKey('googlecolab', colabApiKey);

      // Initialize Colab session
      const { error: initError } = await supabase.functions.invoke('init-colab-session', {
        body: { 
          apiKey: colabApiKey,
          userId: session.user.id
        }
      });

      if (initError) throw initError;

      // Get the latest generated script
      const { data: jobData, error: fetchError } = await supabase
        .from('finetuning_jobs')
        .select('colab_script')
        .eq('user_id', session.user.id)
        .eq('status', 'generated')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      setScript(jobData.colab_script);
      setIsConfigured(true);
      toast.success("Google Colab session initialized successfully");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to initialize Google Colab session");
    }
  };

  const handleExecutionComplete = async () => {
    try {
      // Update job status
      const { error: updateError } = await supabase
        .from('finetuning_jobs')
        .update({ 
          status: 'running'
        })
        .eq('user_id', session?.user?.id)
        .eq('status', 'generated');

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {!isConfigured ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="colabApiKey">Google Colab API Key</Label>
                <Input
                  id="colabApiKey"
                  type="password"
                  placeholder="Enter your Google Colab API key"
                  value={colabApiKey}
                  onChange={(e) => setColabApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  You can find your API key in the Google Colab settings.{" "}
                  <a 
                    href="https://colab.research.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    Open Colab Settings <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
              </div>

              <Button type="submit" className="w-full">
                Configure & Initialize Session
              </Button>
            </form>
          ) : script ? (
            <NotebookInterface 
              script={script}
              onExecutionComplete={handleExecutionComplete}
            />
          ) : (
            <p className="text-center text-muted-foreground">
              No script found. Please generate a fine-tuning script first.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};