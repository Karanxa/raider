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
    const { code_snippet, language, userId } = await req.json();

    if (!code_snippet || !language || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Analyze code for potential vulnerabilities
    const vulnerabilityPoints = [];
    const suggestedPayloads = [];

    // Basic security checks
    if (code_snippet.includes('eval(')) {
      vulnerabilityPoints.push('Use of eval() detected - potential code injection vulnerability');
      suggestedPayloads.push('alert(1)');
    }

    if (code_snippet.includes('innerHTML')) {
      vulnerabilityPoints.push('Use of innerHTML detected - potential XSS vulnerability');
      suggestedPayloads.push('<img src=x onerror=alert(1)>');
    }

    // Store analysis results
    const { error: insertError } = await supabaseClient
      .from('code_snippet_analysis')
      .insert({
        user_id: userId,
        code_snippet,
        language,
        vulnerability_points: vulnerabilityPoints,
        suggested_payloads: suggestedPayloads,
        analysis: 'Security analysis completed'
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        vulnerabilityPoints,
        suggestedPayloads 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Code analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});