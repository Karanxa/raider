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

    const systemPrompt = `You are an expert in enhancing customer interactions and experience. Your task is to transform each provided prompt into a more refined version that reflects authentic customer voice and needs, specifically in the context of ${keyword}.

Guidelines:
- Maintain a natural, conversational customer tone
- Add relevant context about customer needs, pain points, and desires
- Use language that real customers would use when interacting with ${keyword}-related services
- Make each prompt more specific and relatable from a customer's perspective
- Include realistic customer scenarios and situations when relevant
- Focus on customer intent and desired outcomes
- Avoid technical jargon unless it's commonly used by customers
- Keep the tone friendly and approachable
- Ensure each prompt sounds like it comes from a real customer
- Return exactly one augmented version per prompt

Format: Return only the augmented prompt text, nothing else. The output should sound like a real customer speaking.`;

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
              { role: 'user', content: `Transform this prompt into a natural customer voice: "${prompt}"` }
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
                text: `${systemPrompt}\n\nTransform this prompt into a natural customer voice: "${prompt}"`
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