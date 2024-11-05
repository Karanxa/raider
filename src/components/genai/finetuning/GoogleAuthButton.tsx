import { GoogleLogin } from '@react-oauth/google';
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { storeGoogleTokens } from "@/utils/googleAuth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const GoogleAuthButton = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const session = useSession();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!session?.user?.id) {
      toast.error("Please login to continue");
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID is not configured');
      toast.error("Google Client ID is not configured");
      return;
    }

    try {
      console.log("Attempting Google authentication...");
      
      // Exchange the credential for tokens
      const { data, error } = await supabase.functions.invoke('exchange-google-token', {
        body: { 
          code: credentialResponse.code,
          userId: session.user.id
        }
      });

      if (error) {
        console.error('Token exchange error:', error);
        toast.error("Failed to authenticate with Google");
        return;
      }

      if (!data?.tokens) {
        console.error('No tokens received');
        toast.error("No tokens received from Google");
        return;
      }

      console.log("Successfully received Google tokens");

      // Store the tokens
      await storeGoogleTokens(data.tokens, session.user.id);

      toast.success("Successfully connected to Google Colab");
      onAuthSuccess();
    } catch (error) {
      console.error('Error during Google authentication:', error);
      toast.error("Failed to connect to Google Colab");
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="text-center text-red-500">
        Google Client ID is not configured. Please check your environment variables.
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-6">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => {
          console.error("Google Sign In Failed");
          toast.error("Google Sign In Failed");
        }}
        flow="auth-code"
        ux_mode="redirect"
        redirect_uri="https://preview--raider.gptengineer.run/"
        scope="https://www.googleapis.com/auth/drive.file"
        clientId={GOOGLE_CLIENT_ID}
      />
    </div>
  );
};