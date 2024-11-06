import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { githubToken, userId } = await req.json()
    
    if (!githubToken || !userId) {
      throw new Error('Missing required parameters')
    }

    console.log('Starting GitHub scan for user:', userId)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user repositories
    const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.statusText}`)
    }
    
    const repos = await reposResponse.json()
    console.log(`Found ${repos.length} repositories`)

    let scannedRepos = 0;
    const totalRepos = repos.length;
    const startTime = Date.now();

    // Process each repository
    for (const repo of repos) {
      console.log(`Processing repository: ${repo.name}`)
      
      try {
        // Get repository contents
        const contentsResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/main?recursive=1`, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
        
        let contents;
        if (!contentsResponse.ok) {
          // Try master branch if main doesn't exist
          const masterResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/master?recursive=1`, {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          })
          
          if (!masterResponse.ok) {
            console.warn(`Skipping repo ${repo.name}: No main or master branch found`)
            continue
          }
          
          contents = await masterResponse.json()
        } else {
          contents = await contentsResponse.json()
        }

        if (!contents?.tree) {
          console.warn(`No tree found for repo ${repo.name}`)
          continue
        }
        
        // Filter for potential API-containing files
        const apiFiles = contents.tree.filter((item: any) => {
          if (!item?.path) return false
          const ext = item.path.split('.').pop()?.toLowerCase()
          return ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php', 'java', 'go'].includes(ext)
        })

        console.log(`Found ${apiFiles.length} potential API files in ${repo.name}`)

        // Analyze each file for API endpoints
        for (const file of apiFiles) {
          const fileContentResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${file.path}`, {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          })
          
          if (!fileContentResponse.ok) {
            console.warn(`Skipping file ${file.path}: ${fileContentResponse.statusText}`)
            continue
          }

          const fileContent = await fileContentResponse.json()
          
          if (!fileContent?.content) {
            console.warn(`No content found for file ${file.path}`)
            continue
          }

          const content = atob(fileContent.content)
          const lines = content.split('\n')
          
          // Enhanced regex patterns for API endpoints
          const patterns = [
            { regex: /['"`](\/api\/[^'"`]+)['"`]/g, method: 'GET' },
            { regex: /['"`](\/v\d+\/[^'"`]+)['"`]/g, method: 'GET' },
            { regex: /\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
            { regex: /fetch\(['"`]([^'"`]+)['"`]/g, method: 'GET' },
            { regex: /axios\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
            { regex: /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
            { regex: /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
            { regex: /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' }
          ]

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            
            for (const pattern of patterns) {
              const matches = [...line.matchAll(pattern.regex)]
              
              for (const match of matches) {
                const apiPath = pattern.method === 'DYNAMIC' ? match[2] : match[1]
                const method = pattern.method === 'DYNAMIC' ? match[1].toUpperCase() : pattern.method
                
                // Only store if it looks like an API endpoint
                if (apiPath.includes('/api/') || apiPath.includes('/v1/') || apiPath.includes('/v2/')) {
                  console.log(`Found API endpoint: ${method} ${apiPath} in ${file.path}`)
                  
                  // Store the finding
                  await supabaseClient
                    .from('github_api_findings')
                    .insert({
                      repository_name: repo.name,
                      repository_url: repo.html_url,
                      api_path: apiPath,
                      method: method,
                      file_path: file.path,
                      line_number: i + 1,
                      user_id: userId
                    })
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing repo ${repo.name}:`, error)
        continue // Continue with next repo even if one fails
      }

      // Update progress after each repository
      scannedRepos++;
      const progress = (scannedRepos / totalRepos) * 100;
      const elapsedTime = Date.now() - startTime;
      const averageTimePerRepo = elapsedTime / scannedRepos;
      const remainingRepos = totalRepos - scannedRepos;
      const estimatedRemainingTime = Math.round((averageTimePerRepo * remainingRepos) / 1000); // Convert to seconds

      // Format time remaining
      const timeRemaining = estimatedRemainingTime > 60 
        ? `${Math.round(estimatedRemainingTime / 60)} minutes`
        : `${estimatedRemainingTime} seconds`;

      // Broadcast progress
      await supabaseClient.channel('scan-progress').send({
        type: 'broadcast',
        event: 'scan-progress',
        payload: {
          progress,
          timeRemaining,
          totalRepos,
          scannedRepos
        }
      });
    }

    return new Response(
      JSON.stringify({ message: 'Scan completed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})