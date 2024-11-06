import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { repository_url } = await req.json()
    
    if (!repository_url) {
      return new Response(
        JSON.stringify({ error: 'Repository URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract owner and repo from URL
    const urlParts = repository_url.split('/')
    const owner = urlParts[urlParts.length - 2]
    const repo = urlParts[urlParts.length - 1]

    // Try each GitHub token until one works
    const tokens = [
      Deno.env.get('GITHUB_TOKEN_1'),
      Deno.env.get('GITHUB_TOKEN_2'),
      Deno.env.get('GITHUB_TOKEN_3'),
      Deno.env.get('GITHUB_TOKEN_4'),
      Deno.env.get('GITHUB_TOKEN_5')
    ].filter(Boolean)

    if (tokens.length === 0) {
      throw new Error('No GitHub tokens configured')
    }

    let contents = null
    let lastError = null

    // Try each token until one works
    for (const token of tokens) {
      try {
        console.log(`Attempting GitHub API request for ${owner}/${repo}`)
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })

        if (response.status === 403) {
          console.log('Rate limit hit, trying next token')
          continue
        }

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.statusText} (${response.status})`)
        }

        contents = await response.json()
        break
      } catch (error) {
        console.error('Error with token:', error)
        lastError = error
      }
    }

    if (!contents) {
      throw new Error(lastError?.message || 'Failed to fetch repository contents with all available tokens')
    }

    return new Response(
      JSON.stringify({ contents }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error scanning repository:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})