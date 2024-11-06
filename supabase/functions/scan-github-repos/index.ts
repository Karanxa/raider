import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fetchRepositories, fetchRepositoryContents, fetchFileContent } from './github-api.ts'
import { API_PATTERNS } from './api-patterns.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { githubToken, userId, specificRepo } = await req.json()
    
    if (!githubToken || !userId) {
      throw new Error('Missing required parameters')
    }

    console.log('Starting GitHub scan for user:', userId)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let repos = []
    if (specificRepo) {
      // Fetch specific repository
      const repoResponse = await fetch(`https://api.github.com/repos/${specificRepo}`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (!repoResponse.ok) {
        throw new Error(`Failed to fetch repository: ${repoResponse.statusText}`)
      }
      
      repos = [await repoResponse.json()]
    } else {
      // Get all user repositories
      repos = await fetchRepositories(githubToken)
    }

    console.log(`Found ${repos.length} repositories to scan`)

    let scannedRepos = 0
    const totalRepos = repos.length
    const startTime = Date.now()
    const batchSize = 5 // Process repositories in smaller batches
    
    // Process repositories in batches
    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (repo) => {
        try {
          console.log(`Processing repository: ${repo.name}`)
          
          const contents = await fetchRepositoryContents(repo, githubToken)
          
          if (!contents?.tree) {
            console.warn(`No tree found for repo ${repo.name}`)
            return
          }
          
          // Filter for potential API-containing files
          const apiFiles = contents.tree.filter((item: any) => {
            if (!item?.path) return false
            const ext = item.path.split('.').pop()?.toLowerCase()
            return ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php', 'java', 'go'].includes(ext)
          })

          console.log(`Found ${apiFiles.length} potential API files in ${repo.name}`)

          // Process each file
          for (const file of apiFiles) {
            try {
              const fileContent = await fetchFileContent(repo, file.path, githubToken)
              const content = atob(fileContent.content)
              const lines = content.split('\n')
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                
                for (const pattern of API_PATTERNS) {
                  const matches = [...line.matchAll(pattern.regex)]
                  
                  for (const match of matches) {
                    const apiPath = pattern.method === 'DYNAMIC' ? match[2] : match[1]
                    const method = pattern.method === 'DYNAMIC' ? match[1].toUpperCase() : pattern.method
                    
                    if (apiPath.includes('/api/') || apiPath.includes('/v1/') || apiPath.includes('/v2/')) {
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
            } catch (error) {
              console.error(`Error processing file ${file.path}:`, error)
            }
          }
        } catch (error) {
          console.error(`Error processing repo ${repo.name}:`, error)
        }
      }))

      // Update progress after each batch
      scannedRepos += batch.length
      const progress = (scannedRepos / totalRepos) * 100
      const elapsedTime = Date.now() - startTime
      const averageTimePerRepo = elapsedTime / scannedRepos
      const remainingRepos = totalRepos - scannedRepos
      const estimatedRemainingTime = Math.round((averageTimePerRepo * remainingRepos) / 1000)

      const timeRemaining = estimatedRemainingTime > 60 
        ? `${Math.round(estimatedRemainingTime / 60)} minutes`
        : `${estimatedRemainingTime} seconds`

      await supabaseClient.channel('scan-progress').send({
        type: 'broadcast',
        event: 'scan-progress',
        payload: { progress, timeRemaining, totalRepos, scannedRepos }
      })
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
        status: 500
      }
    )
  }
})