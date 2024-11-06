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
    const { githubToken, userId, specificRepo, orgName, includePrivateRepos, scanType } = await req.json();
    
    if (!userId) {
      throw new Error('Missing required parameter: userId');
    }

    if (!scanType) {
      throw new Error('Missing required parameter: scanType');
    }

    if (scanType === 'specific' && !specificRepo) {
      throw new Error('Missing required parameter: specificRepo for specific scan type');
    }

    if (scanType === 'org' && !orgName) {
      throw new Error('Missing required parameter: orgName for organization scan type');
    }

    // Validate GitHub token if required
    if (includePrivateRepos && !githubToken) {
      throw new Error('GitHub token is required for scanning private repositories');
    }

    console.log(`Starting GitHub scan for user: ${userId}, type: ${scanType}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let repos = [];
    try {
      if (scanType === 'specific') {
        console.log(`Fetching specific repository: ${specificRepo}`);
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json'
        };
        
        if (githubToken) {
          headers['Authorization'] = `token ${githubToken}`;
        }
        
        const repoResponse = await fetch(`https://api.github.com/repos/${specificRepo}`, {
          headers
        });
        
        if (!repoResponse.ok) {
          const errorData = await repoResponse.text();
          if (repoResponse.status === 403) {
            throw new Error('GitHub API rate limit exceeded or invalid token. Please provide a valid GitHub token.');
          } else if (repoResponse.status === 404) {
            throw new Error(`Repository ${specificRepo} not found. Please check the repository name.`);
          }
          throw new Error(`Failed to fetch repository: ${errorData}`);
        }
        
        const repo = await repoResponse.json();
        if (!repo.full_name) {
          throw new Error(`Invalid repository data received for ${specificRepo}`);
        }
        
        repos = [repo];
      } else {
        repos = await fetchRepositories(githubToken, includePrivateRepos, orgName);
      }

      if (!repos.length) {
        throw new Error('No repositories found to scan');
      }

      let scannedRepos = 0;
      let totalFindings = 0;
      const totalRepos = repos.length;
      const startTime = Date.now();
      
      for (let i = 0; i < repos.length; i += 5) {
        const batch = repos.slice(i, i + 5);
        
        await Promise.all(batch.map(async (repo) => {
          try {
            if (!repo?.full_name) {
              console.warn(`Skipping invalid repository:`, repo);
              return;
            }

            console.log(`Processing repository: ${repo.full_name}`);
            
            const contents = await fetchRepositoryContents(repo, githubToken);
            
            if (!contents?.tree) {
              console.warn(`No tree found for repo ${repo.full_name}`);
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

            console.log(`Found ${apiFiles.length} potential API files in ${repo.full_name}`);

            for (let j = 0; j < apiFiles.length; j += 5) {
              const filesBatch = apiFiles.slice(j, j + 5);
              const findingsCount = await processFilesBatch(repo, filesBatch, githubToken, supabaseClient, userId);
              totalFindings += findingsCount;
            }
          } catch (error) {
            console.error(`Error processing repo ${repo?.full_name || 'unknown'}:`, error);
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
    } catch (error) {
      console.error('GitHub API Error:', error);
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('rate limit')) {
        errorMessage = 'GitHub API rate limit exceeded. Please provide a valid GitHub token or wait before trying again.';
      } else if (error.message.includes('Forbidden')) {
        errorMessage = 'Access denied. Please check your GitHub token permissions or ensure the repository is public.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
  } catch (error) {
    console.error('General Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});