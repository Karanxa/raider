import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model, taskType, datasetType, datasetPath, customConfig } = await req.json();

    const prompt = `Generate a Google Colab Python script for fine-tuning a ${model} model for ${taskType} using a ${datasetType} dataset.
    The dataset is located at: ${datasetPath}
    Additional configuration: ${JSON.stringify(customConfig)}
    
    The script should include:
    1. Environment setup and dependency installation
    2. Dataset loading and preprocessing
    3. Model initialization and configuration
    4. Training loop with proper checkpointing
    5. Evaluation metrics
    6. Error handling and GPU memory optimization
    7. Detailed comments explaining each step
    
    Use best practices for fine-tuning language models and ensure efficient GPU usage.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an AI expert specializing in creating fine-tuning scripts for language models. Generate clear, well-documented Python code suitable for Google Colab.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const script = data.choices[0].message.content;

    return new Response(JSON.stringify({ script }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-finetuning-script function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});