import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HUGGINGFACE_API = "https://huggingface.co/api/datasets";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { apiKey, category } = await req.json();
    
    if (!apiKey) {
      throw new Error('API key is required');
    }

    if (!category) {
      throw new Error('Category is required');
    }

    // Create a more targeted search query based on the category
    let searchQuery;
    const baseCategory = category.toLowerCase();
    
    if (baseCategory.includes('jail breaking')) {
      searchQuery = 'jailbreak+llm+prompt';
    } else if (baseCategory.includes('prompt injection')) {
      searchQuery = 'prompt+injection+attack';
    } else if (baseCategory.includes('encoding')) {
      searchQuery = 'encoding+adversarial+llm';
    } else if (baseCategory.includes('unsafe')) {
      searchQuery = 'unsafe+prompt+harmful';
    } else if (baseCategory.includes('uncensored')) {
      searchQuery = 'uncensored+prompt+bypass';
    } else if (baseCategory.includes('language based')) {
      searchQuery = 'language+adversarial+attack';
    } else if (baseCategory.includes('glitch')) {
      searchQuery = 'glitch+token+prompt';
    } else if (baseCategory.includes('llm evasion')) {
      searchQuery = 'llm+evasion+technique';
    } else if (baseCategory.includes('leaking')) {
      searchQuery = 'system+prompt+leak';
    } else if (baseCategory.includes('insecure')) {
      searchQuery = 'insecure+output+prompt';
    } else {
      searchQuery = baseCategory.split(' ').join('+');
    }
    
    // Add common terms to improve results
    const finalQuery = `${searchQuery}+dataset+llm`;
    
    const response = await fetch(`${HUGGINGFACE_API}?search=${finalQuery}&full=true&limit=100`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter out datasets with no downloads or likes to ensure quality
    const filteredData = data.filter((dataset: any) => 
      (dataset.downloads > 0 || dataset.likes > 0) && 
      dataset.id && 
      dataset.description
    );
    
    return new Response(
      JSON.stringify({ data: filteredData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})