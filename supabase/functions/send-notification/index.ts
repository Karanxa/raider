import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, message } = await req.json();

    if (!userId || !message) {
      throw new Error('User ID and message are required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's notification settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching notification settings:', settingsError);
      throw new Error('Failed to fetch notification settings');
    }

    // If no settings found, return early with a success response
    if (!settings) {
      console.log('No notification settings found for user:', userId);
      return new Response(
        JSON.stringify({ message: 'No notification settings configured' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let notificationSent = false;

    if (settings.notification_type === 'email' && settings.email_address) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured');
      } else {
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Raider <notifications@raider.dev>',
              to: [settings.email_address],
              subject: 'LLM Scan Notification',
              html: `<p>${message}</p>`,
            }),
          });

          if (emailRes.ok) {
            notificationSent = true;
          } else {
            console.error('Failed to send email:', await emailRes.text());
          }
        } catch (error) {
          console.error('Error sending email:', error);
        }
      }
    }

    if (settings.notification_type === 'slack' && settings.slack_webhook_url) {
      try {
        const slackRes = await fetch(settings.slack_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: message,
          }),
        });

        if (slackRes.ok) {
          notificationSent = true;
        } else {
          console.error('Failed to send Slack notification:', await slackRes.text());
        }
      } catch (error) {
        console.error('Error sending Slack notification:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: notificationSent,
        message: notificationSent ? 'Notification sent successfully' : 'Failed to send notification'
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});