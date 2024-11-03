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

    // Use the category directly as search keywords
    const searchTerm = category.toLowerCase();
    console.log(`Performing generic search on HuggingFace for: ${searchTerm}`);

    const response = await fetch(`${HUGGINGFACE_API}?search=${encodeURIComponent(searchTerm)}&full=true&limit=50`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the results to match our frontend expectations
    const filteredData = data
      .filter((dataset: any) => dataset.id && dataset.description)
      .map((dataset: any) => ({
        id: dataset.id,
        name: dataset.id.split('/').pop(),
        downloads: dataset.downloads,
        likes: dataset.likes,
        description: dataset.description
      }))
      .sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0));
    
    console.log(`Found ${filteredData.length} datasets for search term: ${searchTerm}`);
    
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