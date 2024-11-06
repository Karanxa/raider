import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { githubToken } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user repositories
    const reposResponse = await fetch('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.statusText}`)
    }
    
    const repos = await reposResponse.json()

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
        
        if (!contentsResponse.ok) {
          console.warn(`Skipping repo ${repo.name}: ${contentsResponse.statusText}`)
          continue
        }

        const contents = await contentsResponse.json()
        
        if (!contents?.tree) {
          console.warn(`No tree found for repo ${repo.name}`)
          continue
        }

        // Filter for potential API-containing files
        const apiFiles = contents.tree.filter((item: any) => {
          if (!item?.path) return false
          const ext = item.path.split('.').pop()?.toLowerCase()
          return ['js', 'ts', 'py', 'rb', 'php', 'java', 'go'].includes(ext)
        })

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
          
          // Simple regex patterns for API endpoints
          const patterns = [
            { regex: /['"`](\/api\/[^'"`]+)['"`]/g, method: 'GET' },
            { regex: /\.(get|post|put|delete|patch)\(['"`](\/[^'"`]+)['"`]/gi, method: 'DYNAMIC' },
            { regex: /fetch\(['"`](\/api\/[^'"`]+)['"`]/g, method: 'GET' },
            { regex: /axios\.(get|post|put|delete|patch)\(['"`](\/[^'"`]+)['"`]/gi, method: 'DYNAMIC' }
          ]

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            
            for (const pattern of patterns) {
              const matches = [...line.matchAll(pattern.regex)]
              
              for (const match of matches) {
                const apiPath = match[1]
                const method = pattern.method === 'DYNAMIC' ? match[1].toUpperCase() : pattern.method
                
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
                    user_id: req.headers.get('x-user-id')
                  })
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing repo ${repo.name}:`, error)
        continue // Continue with next repo even if one fails
      }
    }

    return new Response(
      JSON.stringify({ message: 'Scan completed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})