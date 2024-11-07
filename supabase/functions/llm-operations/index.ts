import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (operation) {
      case 'security-test':
        return await handleSecurityTest(params, supabaseAdmin);
      case 'scheduled-scan':
        return await handleScheduledScan(params, supabaseAdmin);
      default:
        throw new Error('Invalid operation specified');
    }
  } catch (error) {
    console.error('Error in llm-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleSecurityTest(params: any, supabaseAdmin: any) {
  const { userId, modelEndpoint, testType } = params;
  
  if (!userId || !modelEndpoint || !testType) {
    throw new Error('Missing required parameters for security test');
  }

  // Original model-security-test logic here
  const result = {
    vulnerabilities: [],
    recommendations: [],
    risk_level: 'low',
  };

  await supabaseAdmin.from('model_security_tests').insert({
    user_id: userId,
    model_endpoint: modelEndpoint,
    test_type: testType,
    vulnerabilities: result.vulnerabilities,
    recommendations: result.recommendations,
    risk_level: result.risk_level,
  });

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleScheduledScan(params: any, supabaseAdmin: any) {
  const { userId, prompt, provider, model } = params;

  if (!userId || !prompt || !provider) {
    throw new Error('Missing required parameters for scheduled scan');
  }

  // Original scheduled-llm-scan logic here
  let response;
  
  if (provider === 'custom') {
    // Handle custom provider logic
    response = await handleCustomProvider(params);
  } else {
    // Handle standard providers
    response = await handleStandardProvider(params);
  }

  await supabaseAdmin.from('llm_scan_results').insert({
    user_id: userId,
    prompt: prompt,
    result: response.result,
    provider: provider,
    model: model,
    scan_type: 'scheduled'
  });

  return new Response(
    JSON.stringify({ success: true, data: response }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCustomProvider(params: any) {
  const { customEndpoint, customHeaders, prompt } = params;
  const headers = customHeaders ? JSON.parse(customHeaders) : {};
  
  const response = await fetch(customEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Custom provider error: ${response.statusText}`);
  }

  return await response.json();
}

async function handleStandardProvider(params: any) {
  const { prompt, model, apiKey } = params;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || "gpt-4-mini",
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates content based on user prompts.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Provider API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    result: data.choices[0].message.content
  };
}