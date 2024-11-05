import { supabase } from "@/integrations/supabase/client";

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export const storeGoogleTokens = async (tokens: GoogleTokens, userId: string) => {
  const { error } = await supabase
    .from('integration_settings')
    .upsert({
      user_id: userId,
      google_oauth_tokens: tokens,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
};

export const getStoredGoogleTokens = async (userId: string): Promise<GoogleTokens | null> => {
  const { data, error } = await supabase
    .from('integration_settings')
    .select('google_oauth_tokens')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.google_oauth_tokens;
};