import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { BatchProcessor } from "./utils/batchProcessor.ts";
import { fetchGitHubContent } from "./utils/githubApi.ts";

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
    
    if (!repository_url || !userId) {
      return new Response(
        JSON.stringify({ error: 'Repository URL and userId are required' }),
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const batchProcessor = new BatchProcessor();
    const processedPaths = new Set<string>();
    const maxDepth = 5;

    async function scanDirectory(path = '', depth = 0) {
      if (depth >= maxDepth || processedPaths.has(path)) {
        return;
      }
      
      processedPaths.add(path);
      console.log(`Scanning directory: ${path} at depth ${depth}`);
      
      try {
        const contents = await fetchGitHubContent(owner, repo, path, githubToken);
        
        const files = contents.filter((item: any) => item.type === 'file');
        await batchProcessor.processBatch(files, userId, { owner, repo, url: repository_url });

        const directories = contents.filter((item: any) => item.type === 'dir');
        const concurrencyLimit = 3;
        
        for (let i = 0; i < directories.length; i += concurrencyLimit) {
          const batch = directories.slice(i, i + concurrencyLimit);
          await Promise.all(
            batch.map(dir => scanDirectory(dir.path, depth + 1))
          );
        }
      } catch (error) {
        console.error(`Error scanning directory ${path}:`, error);
      }
    }

    await scanDirectory();

    return new Response(
      JSON.stringify({ message: 'Repository scan initiated successfully' }),
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