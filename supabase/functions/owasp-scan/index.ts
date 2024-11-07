import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, userId } = await req.json();

    if (!url || !userId) {
      return new Response(
        JSON.stringify({ error: 'URL and userId are required' }),
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

    // Mock OWASP scan results for demonstration
    const mockVulnerabilities = [
      {
        user_id: userId,
        target_url: url,
        vulnerability_type: "SQL Injection",
        severity: "high",
        description: "Potential SQL injection vulnerability detected in API endpoint",
        recommendation: "Use parameterized queries and input validation",
        owasp_category: "Injection"
      },
      {
        user_id: userId,
        target_url: url,
        vulnerability_type: "XSS",
        severity: "medium",
        description: "Cross-site scripting vulnerability found in response",
        recommendation: "Implement proper output encoding",
        owasp_category: "Cross-Site Scripting"
      }
    ];

    // Insert results into database
    const { error: insertError } = await supabaseClient
      .from('api_security_issues')
      .insert(mockVulnerabilities);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, data: mockVulnerabilities }),
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