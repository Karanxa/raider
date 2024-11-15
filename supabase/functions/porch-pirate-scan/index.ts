import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization } = await req.json();
    console.log(`Starting Postman collection scan for: ${organization}`);

    // Search patterns to try
    const searchPatterns = [
      `https://www.postman.com/search?q=${organization}`,
      `https://www.postman.com/${organization}`,
      `https://www.postman.com/search?q=${organization}+api`,
      `https://www.postman.com/search?q=${organization}+collection`,
    ];

    const collections = new Set();
    
    for (const pattern of searchPatterns) {
      try {
        console.log(`Searching pattern: ${pattern}`);
        const response = await fetch(pattern);
        const html = await response.text();

        // Extract collection URLs using regex patterns
        const collectionUrlPattern = /https:\/\/www\.postman\.com\/[^"'\s]+\/collection\/[^"'\s]+/g;
        const matches = html.match(collectionUrlPattern) || [];
        
        // Add unique collection URLs
        matches.forEach(url => collections.add(url));

        // Extract workspace URLs to find more collections
        const workspacePattern = /https:\/\/www\.postman\.com\/[^"'\s]+\/workspace\/[^"'\s]+/g;
        const workspaceMatches = html.match(workspacePattern) || [];

        // Check each workspace for collections
        for (const workspaceUrl of workspaceMatches) {
          try {
            console.log(`Checking workspace: ${workspaceUrl}`);
            const workspaceResponse = await fetch(workspaceUrl);
            const workspaceHtml = await workspaceResponse.text();
            const workspaceCollections = workspaceHtml.match(collectionUrlPattern) || [];
            workspaceCollections.forEach(url => collections.add(url));
          } catch (error) {
            console.error(`Error processing workspace ${workspaceUrl}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing pattern ${pattern}:`, error);
      }
    }

    const uniqueCollections = Array.from(collections);
    console.log(`Found ${uniqueCollections.length} unique collections`);

    // Store in Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (uniqueCollections.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('postman_collections')
        .upsert(
          uniqueCollections.map(url => ({
            collection_url: url,
            collection_name: url.split('/').pop()?.replace(/-/g, ' '),
            organization: organization,
            description: `Public API collection for ${organization}`,
            metadata: { source: 'postman-scan' }
          })),
          { onConflict: 'collection_url' }
        );

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        collectionsFound: uniqueCollections.length 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});