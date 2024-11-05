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
    const { 
      modelName, 
      datasetType, 
      taskType, 
      datasetDescription,
      trainingExamples,
      hyperparameters, 
      apiKey 
    } = await req.json();

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    console.log('Generating fine-tuning script with params:', {
      modelName,
      datasetType,
      taskType,
      examplesCount: trainingExamples.split('\n').length,
      hyperparameters
    });

    const systemPrompt = `You are an AI assistant that generates Python scripts for fine-tuning machine learning models in Google Colab. Generate clear, well-documented code with proper error handling and progress tracking.`;

    const userPrompt = `Create a complete Google Colab Python script for fine-tuning a ${modelName} model for ${taskType} tasks using a ${datasetType} dataset.

Dataset Description:
${datasetDescription}

Training Examples (first few):
${trainingExamples.split('\n').slice(0, 5).join('\n')}
...

Hyperparameters:
- Learning Rate: ${hyperparameters.learningRate}
- Batch Size: ${hyperparameters.batchSize}
- Epochs: ${hyperparameters.epochs}

Requirements:
1. Include all necessary imports and setup
2. Add proper error handling and progress tracking
3. Save checkpoints during training
4. Include evaluation metrics
5. Add comments explaining each major step
6. Make it easy to upload custom datasets
7. Include example usage at the end`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const script = data.choices[0].message.content;

    console.log('Successfully generated fine-tuning script');

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