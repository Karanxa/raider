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
    const { domain, userId, templates, url } = await req.json();
    console.log(`Starting Nuclei scan for ${url ? 'URL: ' + url : 'domain: ' + domain}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let targets: string[] = [];
    
    if (url) {
      // Ad-hoc scan
      targets = [url];
    } else {
      // Domain-based scan
      const { data: reconData } = await supabaseAdmin
        .from('domain_recon_results')
        .select('ok_endpoints, live_subdomains')
        .eq('root_domain', domain)
        .eq('user_id', userId)
        .order('scan_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (reconData) {
        targets = [...reconData.ok_endpoints, ...reconData.live_subdomains];
      }
    }

    if (targets.length === 0) {
      throw new Error('No targets found for scanning');
    }

    // Write targets to a temporary file
    const tempFile = await Deno.makeTempFile();
    await Deno.writeTextFile(tempFile, targets.join('\n'));

    // Prepare nuclei command arguments
    const args = ["-l", tempFile, "-silent"];
    if (templates && templates.length > 0) {
      args.push("-t", ...templates);
    }

    // Run nuclei scan
    const nucleiProcess = new Deno.Command("nuclei", { args });
    const nucleiOutput = await nucleiProcess.output();
    const findings = new TextDecoder().decode(nucleiOutput.stdout).trim().split('\n');

    // Parse and store findings
    for (const finding of findings) {
      if (!finding) continue;
      
      try {
        const [severity, name, url, matched] = finding.split('|').map(s => s.trim());
        
        await supabaseAdmin
          .from('nuclei_scan_results')
          .insert({
            domain: domain || new URL(url).hostname,
            url,
            severity,
            finding_name: name,
            matched_at: matched,
            user_id: userId
          });
      } catch (e) {
        console.error('Error parsing finding:', e);
      }
    }

    // Cleanup
    await Deno.remove(tempFile);

    return new Response(
      JSON.stringify({ message: 'Nuclei scan completed successfully', findingsCount: findings.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in nuclei-scan function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});