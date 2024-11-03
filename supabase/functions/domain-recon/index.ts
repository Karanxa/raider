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

    // Run subfinder for subdomain enumeration
    const subfinderProcess = new Deno.Command("subfinder", {
      args: ["-d", domain, "-silent"],
    });
    const subfinderOutput = await subfinderProcess.output();
    const subdomains = new TextDecoder().decode(subfinderOutput.stdout).trim().split('\n');
    console.log(`Found ${subdomains.length} subdomains`);

    // Run httpx to check live subdomains
    const httpxInput = subdomains.join('\n');
    const httpxProcess = new Deno.Command("httpx", {
      args: ["-silent"],
      stdin: "piped",
    });
    const httpxChild = httpxProcess.spawn();
    const writer = httpxChild.stdin.getWriter();
    await writer.write(new TextEncoder().encode(httpxInput));
    await writer.close();
    const httpxOutput = await httpxChild.output();
    const liveSubdomains = new TextDecoder().decode(httpxOutput.stdout).trim().split('\n');
    console.log(`Found ${liveSubdomains.length} live subdomains`);

    // Run katana for crawling
    const results = {
      js_files: [] as string[],
      file_endpoints: [] as string[],
      ok_endpoints: [] as string[]
    };

    for (const target of liveSubdomains) {
      if (!target) continue;
      console.log(`Crawling ${target}`);
      
      const katanaProcess = new Deno.Command("katana", {
        args: ["-u", target, "-silent", "-jc"],
      });
      const katanaOutput = await katanaProcess.output();
      const endpoints = new TextDecoder().decode(katanaOutput.stdout).trim().split('\n');

      for (const endpoint of endpoints) {
        if (!endpoint) continue;
        if (endpoint.endsWith('.js')) {
          results.js_files.push(endpoint);
        } else if (endpoint.match(/\.(txt|csv|json|xml)$/)) {
          results.file_endpoints.push(endpoint);
        } else {
          results.ok_endpoints.push(endpoint);
        }
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