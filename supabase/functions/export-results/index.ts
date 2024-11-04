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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's integration settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('integration_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) throw new Error('Failed to fetch integration settings');

    switch (exportType) {
      case 'jira':
        if (!settings.jira_api_token || !settings.jira_email || !settings.jira_domain) {
          throw new Error('Jira credentials not configured');
        }

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
          throw new Error('Failed to create Jira ticket');
        }
        break;

      case 'slack':
        if (!settings.slack_webhook_url) {
          throw new Error('Slack webhook URL not configured');
        }

        const csvContent = results.map(r => ({
          prompt: r.prompt,
          result: r.result,
          provider: r.provider,
          model: r.model || '',
          created_at: new Date(r.created_at).toLocaleString(),
        }));

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
          throw new Error('Failed to send Slack notification');
        }
        break;

      default:
        throw new Error('Invalid export type');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});