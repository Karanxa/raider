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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // For now, we'll focus on specific organizations' collections
    // This can be expanded later to include more sources
    const targetOrgs = [
      "postman",
      "stripe",
      "github",
      "twitter",
      "microsoft",
    ];

    // Simulate finding collections (in a real implementation, this would involve
    // actual web crawling or API calls to Postman's discovery service)
    const mockCollections = targetOrgs.map(org => ({
      collection_url: `https://www.postman.com/collections/${org}-api-${Date.now()}`,
      collection_name: `${org.charAt(0).toUpperCase() + org.slice(1)} API Collection`,
      organization: org,
      description: `Public API collection for ${org}`,
      last_updated: new Date().toISOString(),
    }));

    // Store the discovered collections
    const { error } = await supabaseClient
      .from("postman_collections")
      .insert(mockCollections);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Collections crawled successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});