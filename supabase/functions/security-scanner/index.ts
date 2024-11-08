import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchRepositories, fetchRepositoryContents, processFilesBatch } from './github-api.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, ...params } = await req.json();
    
    switch (operation) {
      case 'nuclei-scan':
        return await handleNucleiScan(params);
      case 'domain-recon':
        return await handleDomainRecon(params);
      case 'github-scan':
        return await handleGithubScan(params);
      case 'ip-intelligence':
        return await handleIPIntelligence(params);
      default:
        throw new Error('Invalid operation specified');
    }
  } catch (error) {
    console.error('Error in security-scanner:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleNucleiScan({ domain, userId, templates, url }) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let targets = [];
  
  if (url) {
    targets = [url];
  } else {
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
}

async function handleDomainRecon({ domain, userId }) {
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
}

async function handleGithubScan({ githubToken, userId, specificRepo }) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let repos = []
  if (specificRepo) {
    const repoResponse = await fetch(`https://api.github.com/repos/${specificRepo}`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!repoResponse.ok) {
      throw new Error(`Failed to fetch repository: ${repoResponse.statusText}`);
    }
    
    repos = [await repoResponse.json()]
  } else {
    repos = await fetchRepositories(githubToken);
  }

  console.log(`Found ${repos.length} repositories to scan`);

  let scannedRepos = 0;
  let totalFindings = 0;
  const totalRepos = repos.length;
  const startTime = Date.now();
  
  for (let i = 0; i < repos.length; i += 5) {
    const batch = repos.slice(i, i + 5);
    
    await Promise.all(batch.map(async (repo) => {
      try {
        console.log(`Processing repository: ${repo.name}`);
        
        const contents = await fetchRepositoryContents(repo, githubToken);
        
        if (!contents?.tree) {
          console.warn(`No tree found for repo ${repo.name}`);
          return;
        }
        
        const apiFiles = contents.tree.filter((item: any) => {
          if (!item?.path) return false;
          const ext = item.path.split('.').pop()?.toLowerCase();
          return [
            'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php', 'java', 'go',
            'cs', 'cpp', 'c', 'h', 'swift', 'kt', 'rs', 'dart'
          ].includes(ext);
        });

        console.log(`Found ${apiFiles.length} potential API files in ${repo.name}`);

        for (let j = 0; j < apiFiles.length; j += 5) {
          const filesBatch = apiFiles.slice(j, j + 5);
          const findingsCount = await processFilesBatch(repo, filesBatch, githubToken, supabaseClient, userId);
          totalFindings += findingsCount;
        }
      } catch (error) {
        console.error(`Error processing repo ${repo.name}:`, error);
      }
    }));

    scannedRepos += batch.length;
    const progress = (scannedRepos / totalRepos) * 100;
    const elapsedTime = Date.now() - startTime;
    const averageTimePerRepo = elapsedTime / scannedRepos;
    const remainingRepos = totalRepos - scannedRepos;
    const estimatedRemainingTime = Math.round((averageTimePerRepo * remainingRepos) / 1000);

    const timeRemaining = estimatedRemainingTime > 60 
      ? `${Math.round(estimatedRemainingTime / 60)} minutes`
      : `${estimatedRemainingTime} seconds`;

    await supabaseClient.channel('scan-progress').send({
      type: 'broadcast',
      event: 'scan-progress',
      payload: { 
        progress, 
        timeRemaining, 
        totalRepos, 
        scannedRepos,
        totalFindings
      }
    });
  }

  return new Response(
    JSON.stringify({ 
      message: 'Scan completed successfully',
      totalFindings
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleIPIntelligence({ ipAddress, userId }) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Simulate IP intelligence gathering
  const result = {
    asn_info: { asn: '12345', organization: 'Example ISP' },
    dns_records: ['example.com', 'test.example.com'],
    geolocation: { country: 'US', city: 'New York' },
    reverse_dns: 'host.example.com',
    whois_data: { registrar: 'Example Registrar' }
  };

  await supabaseAdmin
    .from('ip_intelligence_results')
    .insert({
      user_id: userId,
      ip_address: ipAddress,
      ...result
    });

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
