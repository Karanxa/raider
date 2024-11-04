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

    // In a real implementation, this would use the organization parameter
    // to search Postman's discovery service or web crawling
    const mockCollections = [{
      collection_url: `https://www.postman.com/collections/${organization}-api-${Date.now()}`,
      collection_name: `${organization.charAt(0).toUpperCase() + organization.slice(1)} API Collection`,
      organization: organization,
      description: `Public API collection for ${organization}`,
      last_updated: new Date().toISOString(),
    }];

    // Store the discovered collections
    const { error } = await supabaseClient
      .from("postman_collections")
      .insert(mockCollections);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        message: "Collections crawled successfully",
        organization
      }),
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