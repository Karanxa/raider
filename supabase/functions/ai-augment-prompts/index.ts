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
    const { prompts, keyword, provider, apiKey, userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const systemPrompt = `You are an expert in enhancing prompts to be more sophisticated and contextual. Your task is to transform each provided prompt into a more refined version, specifically in the context of ${keyword}.

Guidelines:
- Keep the core intent of each prompt
- Add relevant context and specific details related to ${keyword}
- Use natural, professional language
- Make each prompt more engaging and specific
- Do not add any prefixes, bullet points, or explanations
- Return exactly one augmented version per prompt
- Focus on the business context, avoid security or technical aspects
- Keep responses concise and direct

Format: Return only the augmented prompt text, nothing else.`;

    let augmentedPrompts = [];
    
    if (provider === 'openai') {
      // Process each prompt individually to maintain 1:1 mapping
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
              { role: 'user', content: `Transform this prompt: "${prompt}"` }
            ],
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        return data.choices[0].message.content.trim();
      }));
    } else if (provider === 'gemini') {
      // Process each prompt individually with Gemini
      augmentedPrompts = await Promise.all(prompts.map(async (prompt: string) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `${systemPrompt}\n\nTransform this prompt: "${prompt}"`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
            },
          }),
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
      }));
    } else {
      throw new Error('Invalid provider specified');
    }

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const promises = prompts.map((originalPrompt: string, index: number) => {
      return supabaseClient.from('prompt_augmentations').insert({
        user_id: userId,
        original_prompt: originalPrompt,
        keyword,
        augmented_prompt: augmentedPrompts[index] || 'No augmentation generated',
      });
    });

    await Promise.all(promises);

    return new Response(
      JSON.stringify({ success: true, augmentedPrompts }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-augment-prompts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});