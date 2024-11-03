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

    const systemPrompt = `You are an expert in helping generate authentic customer voice prompts. Your task is to help us write prompts that sound like they're coming directly from real customers in the ${keyword} context.

Guidelines:
- Write as if you are a real customer expressing their needs, questions, or concerns
- Use first-person perspective ("I need", "I'm looking for", "Can you help me with")
- Include realistic customer emotions, frustrations, and desires
- Reference common situations that customers in ${keyword} context face
- Keep the language casual and conversational, like how real people talk
- Avoid any business or technical jargon unless it's commonly used by customers
- Make it personal and relatable
- Include specific details that a real customer would mention
- Focus on what the customer wants to achieve or solve

Format: Return only the transformed prompt in first-person customer voice, without any explanations or additional text.`;

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
    } else if (provider === 'gemini') {
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
                text: `${systemPrompt}\n\nHelp me transform this into a natural customer voice: "${prompt}"`
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