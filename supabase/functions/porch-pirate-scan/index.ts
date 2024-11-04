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
    console.log(`Starting porch-pirate scan for: ${organization}`);

    // Execute porch-pirate command
    const command = new Deno.Command("porch-pirate", {
      args: ["-t", organization],
      stdout: "piped",
      stderr: "piped",
    });

    const { stdout, stderr } = await command.output();
    const output = new TextDecoder().decode(stdout);
    const errors = new TextDecoder().decode(stderr);

    if (errors) {
      console.error(`Porch-pirate errors: ${errors}`);
    }

    // Parse the output to extract collections
    const collections = parseOutput(output);
    console.log(`Found ${collections.length} collections`);

    // Store in Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (collections.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('postman_collections')
        .upsert(
          collections.map(col => ({
            collection_url: col.url,
            collection_name: col.name,
            organization: organization,
            description: col.description,
            metadata: { source: 'porch-pirate' }
          })),
          { onConflict: 'collection_url' }
        );

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        collectionsFound: collections.length 
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

function parseOutput(output: string) {
  const collections: Array<{
    url: string;
    name: string;
    description?: string;
  }> = [];

  // Split output into lines and parse each collection
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes('postman.com') && line.includes('/collection/')) {
      const url = line.trim();
      collections.push({
        url,
        name: url.split('/').pop()?.replace(/-/g, ' ') || 'Unnamed Collection',
        description: 'Discovered via porch-pirate'
      });
    }
  }

  return collections;
}