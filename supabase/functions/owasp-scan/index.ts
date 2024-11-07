import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, verbose } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all API findings for the user
    const { data: findings, error: findingsError } = await supabaseClient
      .from('github_api_findings')
      .select('*')
      .eq('user_id', userId);

    if (findingsError) throw findingsError;

    // For each API endpoint found, perform OWASP scan
    const scanResults = await Promise.all(findings.map(async (finding, index) => {
      if (verbose) {
        // Send progress updates through realtime
        await supabaseClient.channel('scan-progress').send({
          type: 'broadcast',
          event: 'scan-progress',
          payload: { 
            progress: Math.round((index / findings.length) * 100),
            message: `Scanning ${finding.api_path} (${finding.method})...`
          }
        });
      }

      // Mock OWASP scan results - in production this would be real scanning logic
      const vulnerabilities = [
        {
          user_id: userId,
          finding_id: finding.id,
          vulnerability_type: "Authentication",
          severity: "high",
          description: "API endpoint lacks proper authentication mechanisms",
          recommendation: "Implement OAuth 2.0 or JWT authentication",
          owasp_category: "Broken Authentication",
          target_url: finding.api_path
        },
        {
          user_id: userId,
          finding_id: finding.id,
          vulnerability_type: "Rate Limiting",
          severity: "medium",
          description: "No rate limiting detected on API endpoint",
          recommendation: "Implement rate limiting to prevent abuse",
          owasp_category: "Lack of Resources & Rate Limiting",
          target_url: finding.api_path
        }
      ];

      if (verbose) {
        await supabaseClient.channel('scan-progress').send({
          type: 'broadcast',
          event: 'scan-progress',
          payload: { 
            message: `Found ${vulnerabilities.length} vulnerabilities in ${finding.api_path}`
          }
        });
      }

      // Insert scan results
      const { error: insertError } = await supabaseClient
        .from('api_security_issues')
        .insert(vulnerabilities);

      if (insertError) throw insertError;

      return vulnerabilities;
    }));

    if (verbose) {
      await supabaseClient.channel('scan-progress').send({
        type: 'broadcast',
        event: 'scan-progress',
        payload: { 
          progress: 100,
          message: `Scan completed. Total vulnerabilities found: ${scanResults.flat().length}`
        }
      });
    }

    return new Response(
      JSON.stringify({ success: true, data: scanResults.flat() }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('OWASP scan error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});