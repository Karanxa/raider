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
    const { operation, ...params } = await req.json();
    
    switch (operation) {
      case 'augment-prompts':
        return await handlePromptAugmentation(params);
      case 'analyze-code':
        return await handleCodeAnalysis(params);
      case 'analyze-document':
        return await handleDocumentAnalysis(params);
      case 'chat-support':
        return await handleChatSupport(params);
      default:
        throw new Error('Invalid operation specified');
    }
  } catch (error) {
    console.error('Error in ai-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handlePromptAugmentation({ prompts, keyword, provider, apiKey, userId }) {
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
  } else if (provider === 'gemini') {
    augmentedPrompts = await Promise.all(prompts.map(async (prompt: string) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nHelp me transform this into a natural customer voice: "${prompt}"` }]
          }],
          generationConfig: { temperature: 0.7 },
        }),
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
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

async function handleChatSupport({ message, context }) {
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

async function handleCodeAnalysis({ codeSnippet, language, apiKey, userId }) {
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

async function handleDocumentAnalysis({ file, apiKey }) {
  const fileContent = await new Response(file).text();
    
  if (!fileContent) {
    throw new Error('File content is empty');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert security analyst specializing in threat modeling and security architecture review.'
        },
        { 
          role: 'user', 
          content: `Analyze this document for security threats:\n\n${fileContent}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  const analysis = JSON.parse(data.choices[0].message.content);

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}