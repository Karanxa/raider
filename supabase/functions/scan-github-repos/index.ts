import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    async function scanFile(file: GitHubFile) {
      if (!file.download_url) return;
      
      const response = await fetch(file.download_url);
      const content = await response.text();
      
      // Regular expressions for finding API endpoints
      const patterns = [
        /['"`](\/api\/[^'"`]+)['"`]/g,
        /['"`](https?:\/\/[^'"`]+)['"`]/g,
        /\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi,
        /fetch\(['"`]([^'"`]+)['"`]/g,
        /axios\.[a-z]+\(['"`]([^'"`]+)['"`]/g,
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

            findings.push({
              path,
              method,
              lineNumber: index + 1,
            });
          }
        });
      });

      return findings;
    }

    async function scanDirectory(path = '') {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const contents: GitHubFile[] = await response.json();

      for (const item of contents) {
        if (item.type === 'file' && 
            (item.name.endsWith('.js') || 
             item.name.endsWith('.ts') || 
             item.name.endsWith('.jsx') || 
             item.name.endsWith('.tsx'))) {
          const findings = await scanFile(item);
          
          if (findings && findings.length > 0) {
            for (const finding of findings) {
              await supabaseAdmin
                .from('github_api_findings')
                .insert({
                  user_id: userId,
                  repository_name: repo,
                  repository_url: repository_url,
                  repository_owner: owner,
                  api_path: finding.path,
                  method: finding.method,
                  file_path: item.path,
                  line_number: finding.lineNumber,
                });
            }
          }
        } else if (item.type === 'dir') {
          await scanDirectory(item.path);
        }
      }
    }

    // Start the recursive scan
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