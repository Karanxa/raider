import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";

export const PerformFineTuning = () => {
  const [colabUrl, setColabUrl] = useState("");
  const session = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("Please login to continue");
      return;
    }

    if (!colabUrl) {
      toast.error("Please enter a Colab notebook URL");
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
        .eq('status', 'generated');

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
              Start your fine-tuning job by providing the Google Colab notebook URL where you've pasted the generated script.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="colabUrl">Google Colab URL</Label>
              <Input
                id="colabUrl"
                placeholder="https://colab.research.google.com/..."
                value={colabUrl}
                onChange={(e) => setColabUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Paste the URL of your Google Colab notebook where you've added the generated fine-tuning script.
              </p>
            </div>

            <Button type="submit" className="w-full">
              Start Fine-tuning
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};