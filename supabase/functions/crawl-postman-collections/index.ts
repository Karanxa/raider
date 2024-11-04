import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { organization } = await req.json();

    if (!organization) {
      throw new Error("Organization or keyword is required");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Search patterns to try
    const searchPatterns = [
      `https://www.postman.com/search?q=${organization}`,
      `https://www.postman.com/${organization}`,
      `https://www.postman.com/search?q=${organization}+api`,
      `https://www.postman.com/search?q=${organization}+collection`,
      `https://www.postman.com/search?q=${organization}+public`,
    ];

    const collections: any[] = [];
    console.log(`Starting crawl for organization: ${organization}`);

    for (const pattern of searchPatterns) {
      try {
        console.log(`Searching pattern: ${pattern}`);
        const response = await fetch(pattern);
        const html = await response.text();

        // Extract collection URLs using regex patterns
        const collectionUrlPattern = /https:\/\/www\.postman\.com\/[^"'\s]+\/collection\/[^"'\s]+/g;
        const matches = html.match(collectionUrlPattern) || [];
        
        // Extract workspace URLs
        const workspacePattern = /https:\/\/www\.postman\.com\/[^"'\s]+\/workspace\/[^"'\s]+/g;
        const workspaceMatches = html.match(workspacePattern) || [];

        // Process collection URLs
        for (const url of matches) {
          if (!collections.some(c => c.collection_url === url)) {
            collections.push({
              collection_url: url,
              collection_name: url.split('/').pop()?.replace(/-/g, ' '),
              organization: organization,
              description: `Public API collection for ${organization}`,
              last_updated: new Date().toISOString(),
            });
          }
        }

        // Process workspace URLs to find more collections
        for (const workspaceUrl of workspaceMatches) {
          try {
            console.log(`Checking workspace: ${workspaceUrl}`);
            const workspaceResponse = await fetch(workspaceUrl);
            const workspaceHtml = await workspaceResponse.text();
            const workspaceCollections = workspaceHtml.match(collectionUrlPattern) || [];

            for (const url of workspaceCollections) {
              if (!collections.some(c => c.collection_url === url)) {
                collections.push({
                  collection_url: url,
                  collection_name: url.split('/').pop()?.replace(/-/g, ' '),
                  organization: organization,
                  description: `Found in ${organization} workspace`,
                  last_updated: new Date().toISOString(),
                });
              }
            }
          } catch (error) {
            console.error(`Error processing workspace ${workspaceUrl}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing pattern ${pattern}:`, error);
      }
    }

    console.log(`Found ${collections.length} collections`);

    if (collections.length > 0) {
      const { error: insertError } = await supabaseClient
        .from("postman_collections")
        .upsert(collections, { 
          onConflict: 'collection_url',
          ignoreDuplicates: true 
        });

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        message: `Found ${collections.length} collections`,
        collectionsCount: collections.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Crawler error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});