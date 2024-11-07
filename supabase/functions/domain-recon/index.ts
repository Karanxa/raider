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
    const { domain, userId } = await req.json();
    console.log(`Starting reconnaissance for domain: ${domain}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create initial record
    const { data: scanRecord, error: insertError } = await supabaseAdmin
      .from('domain_recon_results')
      .insert({
        root_domain: domain,
        user_id: userId,
        scan_status: 'running'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Simulate subdomain discovery with a basic DNS query
    const subdomains = [`www.${domain}`, `api.${domain}`, `mail.${domain}`];
    console.log(`Found ${subdomains.length} subdomains`);

    // Check live subdomains
    const liveSubdomains = [];
    for (const subdomain of subdomains) {
      try {
        const response = await fetch(`https://${subdomain}`, { method: 'HEAD' });
        if (response.ok) {
          liveSubdomains.push(`https://${subdomain}`);
        }
      } catch (error) {
        console.error(`Error checking subdomain ${subdomain}:`, error);
      }
    }
    console.log(`Found ${liveSubdomains.length} live subdomains`);

    // Basic crawling simulation
    const results = {
      js_files: [] as string[],
      file_endpoints: [] as string[],
      ok_endpoints: [] as string[]
    };

    for (const target of liveSubdomains) {
      try {
        const response = await fetch(target);
        if (response.ok) {
          const text = await response.text();
          
          // Extract JavaScript files
          const jsMatches = text.match(/src="([^"]+\.js)"/g) || [];
          jsMatches.forEach(match => {
            const jsFile = match.replace('src="', '').replace('"', '');
            if (jsFile.startsWith('http')) {
              results.js_files.push(jsFile);
            } else {
              results.js_files.push(`${target}${jsFile.startsWith('/') ? '' : '/'}${jsFile}`);
            }
          });

          // Extract other file endpoints
          const fileMatches = text.match(/href="([^"]+\.(txt|csv|json|xml))"/g) || [];
          fileMatches.forEach(match => {
            const file = match.replace('href="', '').replace('"', '');
            if (file.startsWith('http')) {
              results.file_endpoints.push(file);
            } else {
              results.file_endpoints.push(`${target}${file.startsWith('/') ? '' : '/'}${file}`);
            }
          });

          // Add the main URL as an OK endpoint
          results.ok_endpoints.push(target);
        }
      } catch (error) {
        console.error(`Error crawling ${target}:`, error);
      }
    }

    // Update the scan record with results
    const { error: updateError } = await supabaseAdmin
      .from('domain_recon_results')
      .update({
        live_subdomains: liveSubdomains,
        js_files: results.js_files,
        file_endpoints: results.file_endpoints,
        ok_endpoints: results.ok_endpoints,
        scan_status: 'completed'
      })
      .eq('id', scanRecord.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: 'Reconnaissance completed successfully', results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in domain-recon function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});