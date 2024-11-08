import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const handleGithubScan = async ({ githubToken, userId, specificRepo }) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let repos = [];
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
    
    repos = [await repoResponse.json()];
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
};
