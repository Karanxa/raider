import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelName, datasetType, taskType, hyperparameters, apiKey } = await req.json();

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const prompt = `Generate a Google Colab Python script for fine-tuning a ${modelName} model for ${taskType} using a ${datasetType} dataset. Include these hyperparameters: ${JSON.stringify(hyperparameters)}. The script should be complete and ready to run in Colab.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are an AI assistant that generates Python scripts for fine-tuning machine learning models in Google Colab.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const script = data.choices[0].message.content;

    return new Response(JSON.stringify({ script }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-finetuning-script function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate script',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});