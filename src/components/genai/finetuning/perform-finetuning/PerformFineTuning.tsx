import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

export const PerformFineTuning = () => {
  const [colabApiKey, setColabApiKey] = useState("");
  const [colabUrl, setColabUrl] = useState("");
  const session = useSession();

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
      // First, store the API key
      const { error: updateError } = await supabase
        .from('finetuning_jobs')
        .update({ 
          colab_api_key: colabApiKey,
          status: 'configuring'
        })
        .eq('user_id', session.user.id)
        .eq('status', 'generated');

      if (updateError) throw updateError;

      // Open Google Colab in a new tab
      window.open('https://colab.research.google.com', '_blank');

      toast.success("Google Colab opened in a new tab. Please paste your generated script there.");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to configure Google Colab access");
    }
  };

  const handleStartFineTuning = async () => {
    if (!colabUrl) {
      toast.error("Please enter the Colab notebook URL");
      return;
    }

    try {
      const { error } = await supabase
        .from('finetuning_jobs')
        .update({ 
          status: 'running',
          colab_url: colabUrl 
        })
        .eq('user_id', session.user.id)
        .eq('status', 'configuring');

      if (error) throw error;

      toast.success("Fine-tuning job started successfully");
      setColabUrl("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to start fine-tuning job");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Perform Fine-tuning</h3>
            <p className="text-muted-foreground">
              Configure Google Colab access and start your fine-tuning job.
            </p>
          </div>

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
                  href="https://colab.research.google.com/notebooks/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Open Settings <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            </div>

            <Button type="submit" className="w-full">
              Configure & Open Colab
            </Button>
          </form>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="colabUrl">Google Colab Notebook URL</Label>
              <Input
                id="colabUrl"
                placeholder="https://colab.research.google.com/..."
                value={colabUrl}
                onChange={(e) => setColabUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                After pasting and saving your script in Google Colab, paste the notebook URL here.
              </p>
            </div>

            <Button 
              onClick={handleStartFineTuning} 
              className="w-full"
              variant="secondary"
            >
              Start Fine-tuning
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};