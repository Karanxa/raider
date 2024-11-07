import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { findingId, userId } = await req.json();

    if (!findingId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Finding ID and userId are required' }),
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

    // Fetch the API finding details
    const { data: finding, error: findingError } = await supabaseClient
      .from('github_api_findings')
      .select('*')
      .eq('id', findingId)
      .single();

    if (findingError) throw findingError;
    if (!finding) throw new Error('API finding not found');

    // Perform the OWASP scan logic here
    // For now, we'll just return mock vulnerabilities based on the API endpoint
    const scanResults = {
      vulnerabilities: [
        {
          vulnerability_type: "SQL Injection",
          severity: "high",
          description: `Potential SQL injection vulnerability detected in endpoint: ${finding.api_path}`,
          recommendation: "Use parameterized queries and input validation",
          owasp_category: "Injection"
        },
        {
          vulnerability_type: "Authentication",
          severity: "medium",
          description: `Missing or weak authentication controls in endpoint: ${finding.api_path}`,
          recommendation: "Implement proper authentication mechanisms",
          owasp_category: "Broken Authentication"
        }
      ]
    };

    // Insert results into the database
    const { error: dbError } = await supabaseClient
      .from('api_security_issues')
      .insert(scanResults.vulnerabilities.map(vuln => ({
        user_id: userId,
        finding_id: findingId,
        target_url: finding.api_path,
        ...vuln
      })));

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ success: true, data: scanResults }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('OWASP scan error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});