import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { fetchGitHubContent } from "./utils/githubApi.ts";
import { BatchProcessor } from "./utils/batchProcessor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const urlParts = repository_url.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];

    const githubToken = Deno.env.get('GITHUB_TOKEN_1');
    if (!githubToken) {
      throw new Error('GitHub token not configured');
    }

    const batchProcessor = new BatchProcessor();

    async function scanDirectory(path = '') {
      console.log(`Scanning directory: ${path}`);
      
      try {
        const contents = await fetchGitHubContent(owner, repo, path, githubToken);
        
        // Process files in current directory
        const files = contents.filter((item: any) => item.type === 'file');
        await batchProcessor.processBatch(files, userId, { owner, repo, url: repository_url });

        // Recursively process subdirectories
        const directories = contents.filter((item: any) => item.type === 'dir');
        await Promise.all(directories.map((dir: any) => scanDirectory(dir.path)));

      } catch (error) {
        console.error(`Error scanning directory ${path}:`, error);
      }
    }

    // Start the scan from root directory
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