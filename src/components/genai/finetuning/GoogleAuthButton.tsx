import { GoogleLogin } from '@react-oauth/google';
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { storeGoogleTokens } from "@/utils/googleAuth";

export const GoogleAuthButton = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const session = useSession();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!session?.user?.id) {
      toast.error("Please login to continue");
      return;
    }

    try {
      // Exchange the credential for tokens
      const { data, error } = await supabase.functions.invoke('exchange-google-token', {
        body: { 
          credential: credentialResponse.credential,
          userId: session.user.id
        }
      });

      if (error) {
        console.error('Token exchange error:', error);
        toast.error("Failed to authenticate with Google");
        return;
      }

      if (!data?.tokens) {
        toast.error("No tokens received from Google");
        return;
      }

      // Store the tokens
      await storeGoogleTokens(data.tokens, session.user.id);

      // Initialize Colab session
      const { error: initError } = await supabase.functions.invoke('init-colab-session', {
        body: { userId: session.user.id }
      });

      if (initError) {
        console.error('Init error:', initError);
        toast.error("Failed to initialize Colab session");
        return;
      }

      toast.success("Successfully connected to Google Colab");
      onAuthSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to connect to Google Colab");
    }
  };

  return (
    <div className="flex justify-center mb-6">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => toast.error("Google Sign In Failed")}
        useOneTap
      />
    </div>
  );
};