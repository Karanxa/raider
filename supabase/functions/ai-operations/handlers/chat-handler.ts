const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleChatSupport(params: any) {
  const { message, context } = params;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-mini',
      messages: [
        { role: 'system', content: 'You are a helpful security testing assistant.' },
        { role: 'user', content: `Context: ${context}\n\nQuestion: ${message}` }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('OpenAI API error');
  }

  const data = await response.json();
  return new Response(
    JSON.stringify({ response: data.choices[0].message.content }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}