import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fetchRepositories, fetchRepositoryContents, processFilesBatch } from './github-api.ts'
import { API_PATTERNS } from './api-patterns.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 5

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
      repos = await fetchRepositories(githubToken)
    }

    console.log(`Found ${repos.length} repositories to scan`)

    let scannedRepos = 0
    let totalFindings = 0
    const totalRepos = repos.length
    const startTime = Date.now()
    
    for (let i = 0; i < repos.length; i += BATCH_SIZE) {
      const batch = repos.slice(i, i + BATCH_SIZE)
      
      await Promise.all(batch.map(async (repo) => {
        try {
          console.log(`Processing repository: ${repo.name}`)
          
          const contents = await fetchRepositoryContents(repo, githubToken)
          
          if (!contents?.tree) {
            console.warn(`No tree found for repo ${repo.name}`)
            return
          }
          
          const apiFiles = contents.tree.filter((item: any) => {
            if (!item?.path) return false
            const ext = item.path.split('.').pop()?.toLowerCase()
            return [
              'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php', 'java', 'go',
              'cs', 'cpp', 'c', 'h', 'swift', 'kt', 'rs', 'dart'
            ].includes(ext)
          })

          console.log(`Found ${apiFiles.length} potential API files in ${repo.name}`)

          for (let j = 0; j < apiFiles.length; j += BATCH_SIZE) {
            const filesBatch = apiFiles.slice(j, j + BATCH_SIZE)
            const findingsCount = await processFilesBatch(repo, filesBatch, githubToken, supabaseClient, userId)
            totalFindings += findingsCount
          }
        } catch (error) {
          console.error(`Error processing repo ${repo.name}:`, error)
        }
      }))

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
        payload: { 
          progress, 
          timeRemaining, 
          totalRepos, 
          scannedRepos,
          totalFindings
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        message: 'Scan completed successfully',
        totalFindings
      }),
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