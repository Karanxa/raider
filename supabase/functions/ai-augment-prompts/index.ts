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

    const systemPrompt = `You are an expert in enhancing conversational interactions. Your task is to transform the provided prompts into more sophisticated variations, specifically in the context of ${keyword}.

Focus on creating variations that:
- Use natural, conversational language
- Incorporate specific ${keyword}-related terminology and scenarios
- Include realistic user personas and situations
- Maintain a professional and authentic tone
- Test different interaction patterns and user behaviors

Important Guidelines:
- Each variation should be self-contained and clear
- Focus on the core intent of the original prompt
- Avoid any meta-commentary or explanations
- Keep the output concise and direct
- Ensure the response maintains the original prompt's purpose while being more sophisticated

Format your response as a direct prompt without any prefixes, suffixes, or explanations.`;

    let augmentedPrompts;
    
    if (provider === 'openai') {
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
            { role: 'user', content: `Transform this prompt into a more sophisticated version, maintaining its core purpose but making it more specific to ${keyword} context:\n\n${prompts.join('\n')}` }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      augmentedPrompts = data.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .map(prompt => prompt.replace(/^[-*\d.)\s]+/, '').trim()); // Remove any bullet points or numbering
    } else if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: `${systemPrompt}\n\nTransform this prompt into a more sophisticated version, maintaining its core purpose but making it more specific to ${keyword} context:\n\n${prompts.join('\n')}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      });

      const data = await response.json();
      augmentedPrompts = data.candidates[0].content.parts[0].text
        .split('\n')
        .filter(line => line.trim())
        .map(prompt => prompt.replace(/^[-*\d.)\s]+/, '').trim()); // Remove any bullet points or numbering
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