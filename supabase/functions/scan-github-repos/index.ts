import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitHubFile {
  name: string;
  path: string;
  type: string;
  url: string;
  download_url: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repository_url, userId } = await req.json();
    
    if (!repository_url) {
      return new Response(
        JSON.stringify({ error: 'Repository URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract owner and repo from URL
    const urlParts = repository_url.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];

    const githubToken = Deno.env.get('GITHUB_TOKEN_1');
    if (!githubToken) {
      throw new Error('GitHub token not configured');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process files in batches to avoid timeouts
    const batchSize = 5;
    const processedFiles = new Set();

    async function scanFile(file: GitHubFile) {
      if (!file.download_url || processedFiles.has(file.path)) return null;
      processedFiles.add(file.path);
      
      console.log(`Scanning file: ${file.path}`);
      
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout per file
        
        const response = await fetch(file.download_url, { signal: controller.signal });
        clearTimeout(timeout);
        
        const content = await response.text();
        
        const patterns = [
          /['"`](\/api\/[^'"`]+)['"`]/g,
          /['"`](https?:\/\/[^'"`]+)['"`]/g,
          /\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi,
          /fetch\(['"`]([^'"`]+)['"`]/g,
          /axios\.[a-z]+\(['"`]([^'"`]+)['"`]/g,
          /url:\s*['"`]([^'"`]+)['"`]/g,
          /endpoint:\s*['"`]([^'"`]+)['"`]/g,
        ];

        const findings: Array<{
          path: string;
          method: string;
          lineNumber: number;
        }> = [];

        const lines = content.split('\n');
        lines.forEach((line, index) => {
          patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(line)) !== null) {
              let path = match[1];
              let method = 'GET';

              if (pattern.source.includes('get|post|put|delete|patch')) {
                method = match[1].toUpperCase();
                path = match[2];
              }

              if (path.includes('/api/') || path.includes('http')) {
                findings.push({
                  path,
                  method,
                  lineNumber: index + 1,
                });
              }
            }
          });
        });

        return findings;
      } catch (error) {
        console.error(`Error scanning file ${file.path}:`, error);
        return null;
      }
    }

    async function scanDirectory(path = '') {
      console.log(`Scanning directory: ${path}`);
      
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout for directory listing
        
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const contents: GitHubFile[] = await response.json();
        const filesToProcess = contents.filter(item => 
          item.type === 'file' && 
          (item.name.endsWith('.js') || 
           item.name.endsWith('.ts') || 
           item.name.endsWith('.jsx') || 
           item.name.endsWith('.tsx'))
        );

        // Process files in batches
        for (let i = 0; i < filesToProcess.length; i += batchSize) {
          const batch = filesToProcess.slice(i, i + batchSize);
          const findings = await Promise.all(batch.map(file => scanFile(file)));
          
          // Save findings to database
          for (let j = 0; j < batch.length; j++) {
            const fileFindings = findings[j];
            if (fileFindings && fileFindings.length > 0) {
              console.log(`Found ${fileFindings.length} API endpoints in ${batch[j].path}`);
              
              await Promise.all(fileFindings.map(finding => 
                supabaseAdmin
                  .from('github_api_findings')
                  .insert({
                    user_id: userId,
                    repository_name: repo,
                    repository_url: repository_url,
                    repository_owner: owner,
                    api_path: finding.path,
                    method: finding.method,
                    file_path: batch[j].path,
                    line_number: finding.lineNumber,
                  })
              ));
            }
          }
        }

        // Process directories
        const directories = contents.filter(item => item.type === 'dir');
        await Promise.all(directories.map(dir => scanDirectory(dir.path)));

      } catch (error) {
        console.error(`Error scanning directory ${path}:`, error);
      }
    }

    // Start the scan
    await scanDirectory();

    return new Response(
      JSON.stringify({ message: 'Repository scan completed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error scanning repository:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});