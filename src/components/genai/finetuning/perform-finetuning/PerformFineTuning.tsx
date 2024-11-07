import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotebookInterface } from "./NotebookInterface";
import { GoogleAuthButton } from "../GoogleAuthButton";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const PerformFineTuning = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const session = useSession();
  const [script, setScript] = useState<string | null>(null);

  const handleAuthSuccess = async () => {
    try {
      // Initialize Colab session
      const { error: initError } = await supabase.functions.invoke('init-colab-session', {
        body: { 
          userId: session?.user?.id
        }
      });

      if (initError) throw initError;

      // Get the latest generated script
      const { data: jobData, error: fetchError } = await supabase
        .from('finetuning_jobs')
        .select('colab_script')
        .eq('user_id', session?.user?.id)
        .eq('status', 'generated')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      setScript(jobData.colab_script);
      setIsConfigured(true);
      toast.success("Google Colab connected successfully");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to connect to Google Colab");
    }
  };

  const handleExecutionComplete = async () => {
    try {
      const { error: updateError } = await supabase
        .from('finetuning_jobs')
        .update({ status: 'running' })
        .eq('user_id', session?.user?.id)
        .eq('status', 'generated');

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {!isConfigured ? (
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Connect to Google Colab</h3>
                <p className="text-sm text-muted-foreground">
                  Sign in with your Google account to use Colab's GPU resources
                </p>
                <GoogleAuthButton onAuthSuccess={handleAuthSuccess} />
              </div>
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
    </GoogleOAuthProvider>
  );
};