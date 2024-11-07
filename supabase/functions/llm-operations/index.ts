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
    const { operation, ...params } = await req.json();
    
    switch (operation) {
      case 'scan':
        return await handleLLMScan(params);
      case 'augment-prompts':
        return await handlePromptAugmentation(params);
      case 'scheduled-scan':
        return await handleScheduledScan(params);
      default:
        throw new Error('Invalid operation');
    }
  } catch (error) {
    console.error('Error in llm-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleLLMScan({ prompt, model, provider, apiKey }) {
  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a security analysis assistant.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) throw new Error('OpenAI API error');
    const data = await response.json();
    return new Response(
      JSON.stringify({ result: data.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (provider === 'gemini') {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
      }),
    });

    if (!response.ok) throw new Error('Gemini API error');
    const data = await response.json();
    return new Response(
      JSON.stringify({ result: data.candidates[0].content.parts[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  throw new Error('Unsupported provider');
}

async function handlePromptAugmentation({ prompts, keyword, userId }) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const augmentedPrompts = prompts.map(prompt => {
    let augmentedPrompt = prompt;
    if (!augmentedPrompt.toLowerCase().includes(keyword.toLowerCase())) {
      augmentedPrompt = `${augmentedPrompt} in the context of ${keyword}`;
    }
    return augmentedPrompt;
  });

  await Promise.all(augmentedPrompts.map((augmentedPrompt, index) => {
    return supabaseAdmin.from('prompt_augmentations').insert({
      user_id: userId,
      original_prompt: prompts[index],
      keyword,
      augmented_prompt: augmentedPrompt,
    });
  }));

  return new Response(
    JSON.stringify({ success: true, augmentedPrompts }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleScheduledScan(params) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: scheduledScans } = await supabaseAdmin
    .from('scheduled_llm_scans')
    .select('*')
    .eq('active', true)
    .lte('next_run', new Date().toISOString());

  for (const scan of scheduledScans || []) {
    const result = await handleLLMScan({
      prompt: scan.prompt,
      model: scan.model,
      provider: scan.provider,
      apiKey: scan.api_key
    });

    const data = await result.json();

    await supabaseAdmin.from('llm_scan_results').insert({
      prompt: scan.prompt,
      result: data.result,
      provider: scan.provider,
      model: scan.model,
      scan_type: 'scheduled',
      user_id: scan.user_id,
    });

    if (scan.is_recurring) {
      const nextRun = new Date(Date.now() + 5 * 60000);
      await supabaseAdmin
        .from('scheduled_llm_scans')
        .update({ last_run: new Date().toISOString(), next_run: nextRun.toISOString() })
        .eq('id', scan.id);
    } else {
      await supabaseAdmin
        .from('scheduled_llm_scans')
        .update({ active: false, last_run: new Date().toISOString() })
        .eq('id', scan.id);
    }
  }

  return new Response(
    JSON.stringify({ message: 'Scheduled scans processed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}