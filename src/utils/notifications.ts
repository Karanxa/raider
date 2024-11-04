import { supabase } from "@/integrations/supabase/client";

export const sendNotification = async (userId: string, message: string) => {
  if (!userId) return;

  try {
    await supabase.functions.invoke('send-notification', {
      body: { userId, message }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};