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
    const { 
      exportType, 
      results, 
      jiraProject, 
      jiraIssueType,
      jiraSummary,
      userId 
    } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Processing export request of type ${exportType} for user ${userId}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's integration settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('integration_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      console.error('Settings fetch error:', settingsError);
      throw new Error(`Failed to fetch integration settings: ${settingsError.message}`);
    }

    if (!settings) {
      console.log('No integration settings found for user:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'Integration settings not configured. Please configure your settings first.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    switch (exportType) {
      case 'jira':
        if (!settings.jira_api_token || !settings.jira_email || !settings.jira_domain) {
          return new Response(
            JSON.stringify({ 
              error: 'Jira credentials not configured. Please configure your Jira settings first.' 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log('Creating Jira ticket...');
        const jiraResponse = await fetch(`https://${settings.jira_domain}/rest/api/2/issue`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${settings.jira_email}:${settings.jira_api_token}`)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              project: { key: jiraProject },
              summary: jiraSummary,
              description: results.map(r => 
                `*Prompt:*\n${r.prompt}\n\n*Result:*\n${r.result}\n\n---`
              ).join('\n'),
              issuetype: { name: jiraIssueType },
            },
          }),
        });

        if (!jiraResponse.ok) {
          const errorData = await jiraResponse.text();
          console.error('Jira API error:', errorData);
          throw new Error(`Failed to create Jira ticket: ${errorData}`);
        }

        const jiraData = await jiraResponse.json();
        return new Response(
          JSON.stringify({ success: true, data: jiraData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      case 'slack':
        if (!settings.slack_webhook_url) {
          return new Response(
            JSON.stringify({ 
              error: 'Slack webhook URL not configured. Please configure your Slack settings first.' 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log('Sending Slack notification...');
        const slackResponse = await fetch(settings.slack_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'LLM Scan Results Report',
            attachments: [{
              title: 'Results Summary',
              text: `Total Results: ${results.length}\nExported at: ${new Date().toLocaleString()}`,
              color: '#36a64f'
            }],
          }),
        });

        if (!slackResponse.ok) {
          const errorData = await slackResponse.text();
          console.error('Slack API error:', errorData);
          throw new Error(`Failed to send Slack notification: ${errorData}`);
        }

        return new Response(
          JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      default:
        throw new Error('Invalid export type');
    }
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred during export' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});