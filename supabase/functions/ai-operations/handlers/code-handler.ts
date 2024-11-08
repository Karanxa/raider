import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleCodeAnalysis(params: any) {
  const { codeSnippet, language, apiKey, userId } = params;
  const systemPrompt = `You are an expert in web security and XSS vulnerabilities. Analyze the following ${language} code snippet for potential XSS vulnerabilities.`;

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

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  await supabaseClient.from('code_snippet_analysis').insert({
    user_id: userId,
    code_snippet: codeSnippet,
    language,
    analysis: aiAnalysis.analysis,
    suggested_payloads: aiAnalysis.suggestedPayloads,
    vulnerability_points: aiAnalysis.vulnerabilityPoints
  });

  return new Response(
    JSON.stringify(aiAnalysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}