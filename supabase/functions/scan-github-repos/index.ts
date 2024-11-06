import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fetchRepositories, fetchRepositoryContents, processFilesBatch } from './github-api.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { githubToken, userId, specificRepo, orgName, includePrivateRepos } = await req.json()
    
    if (!githubToken || !userId) {
      throw new Error('GitHub token and userId are required')
    }

    console.log(`Starting GitHub scan for user: ${userId}`)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const repos = specificRepo ? 
      [{ full_name: specificRepo }] : 
      await fetchRepositories(githubToken, includePrivateRepos, orgName)

    if (!repos.length) {
      throw new Error('No repositories found to scan')
    }

    console.log(`Found ${repos.length} repositories to scan`)
    let totalFindings = 0

    for (const repo of repos) {
      try {
        const contents = await fetchRepositoryContents(repo, githubToken)
        if (!contents?.tree) continue

        const apiFiles = contents.tree.filter((item: any) => {
          const ext = item.path?.split('.').pop()?.toLowerCase()
          return ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php'].includes(ext)
        })

        console.log(`Processing ${apiFiles.length} files in ${repo.full_name}`)
        const findings = await processFilesBatch(repo, apiFiles, githubToken, supabaseClient, userId)
        totalFindings += findings
      } catch (error) {
        console.error(`Error processing repo ${repo.full_name}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Scan completed', totalFindings }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})