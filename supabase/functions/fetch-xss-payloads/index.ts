import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get active sources
    const { data: sources } = await supabaseAdmin
      .from('xss_payload_sources')
      .select('*')
      .eq('is_active', true);

    for (const source of sources || []) {
      try {
        const response = await fetch(source.source_url);
        const content = await response.text();

        // Extract XSS payloads using regex patterns
        const payloadPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /on\w+\s*=\s*["'][^"']*["']/gi,
          /javascript:\s*[^"'\s]*/gi,
        ];

        const payloads = new Set();
        payloadPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => payloads.add(match));
          }
        });

        // Insert new payloads
        for (const payload of payloads) {
          const { error } = await supabaseAdmin
            .from('xss_payloads')
            .upsert({
              payload,
              category: 'Auto-discovered',
              source: source.source_name,
              description: `Automatically discovered from ${source.source_name}`,
              tags: ['auto-discovered']
            }, {
              onConflict: 'payload'
            });

          if (error) console.error('Error inserting payload:', error);
        }

        // Update last_fetched timestamp
        await supabaseAdmin
          .from('xss_payload_sources')
          .update({ last_fetched: new Date().toISOString() })
          .eq('id', source.id);

      } catch (error) {
        console.error(`Error processing source ${source.source_name}:`, error);
      }
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-xss-payloads function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});