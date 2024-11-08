import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handlePromptAugmentation(params: any) {
  const { prompts, keyword, provider, apiKey, userId } = params;
  
  if (!userId) {
    throw new Error('User ID is required');
  }

  const systemPrompt = `You are an expert in helping generate authentic customer voice prompts. Your task is to help us write prompts that sound like they're coming directly from real customers in the ${keyword} context.`;

  let augmentedPrompts = [];
  
  if (provider === 'openai') {
    augmentedPrompts = await Promise.all(prompts.map(async (prompt: string) => {
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
            { role: 'user', content: `Help me transform this into a natural customer voice: "${prompt}"` }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content.trim();
    }));
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  await Promise.all(prompts.map((originalPrompt: string, index: number) => {
    return supabaseClient.from('prompt_augmentations').insert({
      user_id: userId,
      original_prompt: originalPrompt,
      keyword,
      augmented_prompt: augmentedPrompts[index] || 'No augmentation generated',
    });
  }));

  return new Response(
    JSON.stringify({ success: true, augmentedPrompts }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}