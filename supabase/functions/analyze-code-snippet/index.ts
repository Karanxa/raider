import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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

    const systemPrompt = `You are an expert in web security and XSS vulnerabilities. Analyze the following ${language} code snippet for potential XSS vulnerabilities.
Focus on identifying vulnerable points and contexts where user input is used. Do not suggest payloads.

Your task is to:
1. Analyze how user input is handled and where it's output
2. Identify potential XSS injection points and their contexts (HTML, JS, attribute, URL, style)
3. Explain any missing security controls
4. For each vulnerability point, specify the exact context where the input is used

Format your response as a JSON object with these exact keys:
{
  "analysis": "Detailed analysis of the vulnerabilities",
  "vulnerabilityPoints": ["List each vulnerable point with its context, e.g., 'innerHTML used directly with user input (HTML context)'"],
  "contexts": ["List of contexts where input is used: html, js, attribute, url, or style"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: codeSnippet }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const aiAnalysis = JSON.parse(data.choices[0].message.content);

    // Generate targeted payloads for each context
    const { generatePayloads, determineContext } = await import('../../src/utils/xssPayloadGenerator.ts');
    
    const suggestedPayloads = new Set<string>();
    aiAnalysis.vulnerabilityPoints.forEach((point: string) => {
      const context = determineContext(point);
      const payloads = generatePayloads(context, aiAnalysis.vulnerabilityPoints);
      payloads.forEach(payload => suggestedPayloads.add(payload));
    });

    const finalAnalysis = {
      analysis: aiAnalysis.analysis,
      vulnerabilityPoints: aiAnalysis.vulnerabilityPoints,
      suggestedPayloads: Array.from(suggestedPayloads)
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
      analysis: finalAnalysis.analysis,
      suggested_payloads: finalAnalysis.suggestedPayloads,
      vulnerability_points: finalAnalysis.vulnerabilityPoints
    });

    return new Response(
      JSON.stringify(finalAnalysis),
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