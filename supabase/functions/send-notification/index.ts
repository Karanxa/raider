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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's notification settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) throw settingsError;
    if (!settings) {
      return new Response(
        JSON.stringify({ error: 'No notification settings found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (settings.notification_type === 'email' && settings.email_address) {
      // Send email using Resend
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not set');
      }

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Raider <notifications@raider.dev>',
          to: [settings.email_address],
          subject: 'LLM Scan Completed',
          html: `<p>${message}</p>`,
        }),
      });

      if (!emailRes.ok) {
        throw new Error('Failed to send email');
      }
    }

    if (settings.notification_type === 'slack' && settings.slack_webhook_url) {
      // Send Slack notification
      const slackRes = await fetch(settings.slack_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
        }),
      });

      if (!slackRes.ok) {
        throw new Error('Failed to send Slack notification');
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
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