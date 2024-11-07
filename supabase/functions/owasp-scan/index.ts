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

    // Mock scan results for demonstration
    const mockVulnerabilities = [
      {
        user_id: userId,
        vulnerability_type: "Authentication",
        severity: "high",
        description: "API endpoint lacks proper authentication mechanisms",
        recommendation: "Implement OAuth 2.0 or JWT authentication",
        owasp_category: "Broken Authentication",
        target_url: "/api/v1/users"
      },
      {
        user_id: userId,
        vulnerability_type: "Rate Limiting",
        severity: "medium",
        description: "No rate limiting detected on API endpoint",
        recommendation: "Implement rate limiting to prevent abuse",
        owasp_category: "Lack of Resources & Rate Limiting",
        target_url: "/api/v1/data"
      }
    ];

    if (verbose) {
      // Send progress updates
      await supabaseClient.from('scan_progress').insert({
        user_id: userId,
        progress: 50,
        message: "Scanning API endpoints..."
      });
    }

    // Insert scan results
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