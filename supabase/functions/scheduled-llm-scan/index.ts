import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active scheduled scans
    const { data: scheduledScans, error: fetchError } = await supabaseAdmin
      .from('scheduled_llm_scans')
      .select('*')
      .eq('active', true)
      .lte('next_run', new Date().toISOString());

    if (fetchError) throw fetchError;

    for (const scan of scheduledScans || []) {
      try {
        let response;
        
        if (scan.provider === 'custom') {
          if (scan.curl_command) {
            // Execute curl command
            const headers: Record<string, string> = {};
            const curlWithPrompt = scan.curl_command.replace(
              scan.prompt_placeholder,
              scan.prompt
            );
            
            const headerMatches = curlWithPrompt.match(/-H "([^"]+)"/g);
            if (headerMatches) {
              headerMatches.forEach(match => {
                const [key, value] = match.slice(4, -1).split(': ');
                if (key && value) headers[key] = value;
              });
            }

            const bodyMatch = curlWithPrompt.match(/-d '([^']+)'/) || curlWithPrompt.match(/-d "([^"]+)"/);
            const body = bodyMatch ? bodyMatch[1] : '';

            response = await fetch(scan.custom_endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...headers,
              },
              body,
            });
          } else {
            const headers = scan.custom_headers ? JSON.parse(scan.custom_headers) : {};
            response = await fetch(scan.custom_endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...headers,
              },
              body: JSON.stringify({ prompt: scan.prompt }),
            });
          }
        } else {
          // Handle standard providers (e.g., OpenAI)
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${scan.api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: scan.model || "gpt-4-mini",
              messages: [
                { role: 'system', content: 'You are a helpful assistant that generates content based on user prompts.' },
                { role: 'user', content: scan.prompt }
              ],
            }),
          });
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const result = scan.provider === 'custom' 
          ? (typeof data === 'string' ? data : JSON.stringify(data, null, 2))
          : data.choices[0].message.content;

        // Store the result
        await supabaseAdmin.from('llm_scan_results').insert({
          prompt: scan.prompt,
          result,
          provider: scan.provider,
          model: scan.model,
          scan_type: 'scheduled',
          user_id: scan.user_id,
        });

        // Update the scan's last_run and next_run
        const now = new Date();
        const updates: any = {
          last_run: now.toISOString(),
        };

        if (scan.is_recurring) {
          // Calculate next run based on cron schedule
          // For this example, we'll just add 5 minutes
          const nextRun = new Date(now.getTime() + 5 * 60000);
          updates.next_run = nextRun.toISOString();
        } else {
          updates.active = false;
        }

        await supabaseAdmin
          .from('scheduled_llm_scans')
          .update(updates)
          .eq('id', scan.id);

      } catch (scanError) {
        console.error(`Error processing scheduled scan ${scan.id}:`, scanError);
      }
    }

    return new Response(
      JSON.stringify({ message: 'Scheduled scans processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scheduled-llm-scan function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})