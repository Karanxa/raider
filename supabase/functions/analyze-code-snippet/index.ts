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
    const { codeSnippet, language, apiKey, userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const systemPrompt = `You are an expert in web security and XSS vulnerabilities. Analyze the following ${language} code snippet for potential XSS vulnerabilities.`;

    // Create mock analysis result (replace with actual OpenAI API call in production)
    const analysis = {
      analysis: "Mock security analysis of the code snippet",
      vulnerabilityPoints: ["Sample vulnerability point 1", "Sample vulnerability point 2"],
      suggestedPayloads: ["<script>alert('xss')</script>", "javascript:alert('xss')"]
    };

    // Store the analysis in the database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient.from('code_snippet_analysis').insert({
      user_id: userId,
      code_snippet: codeSnippet,
      language,
      analysis: analysis.analysis,
      suggested_payloads: analysis.suggestedPayloads,
      vulnerability_points: analysis.vulnerabilityPoints
    });

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-code-snippet function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});