import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const { url, userId } = await req.json()

    if (!url || !userId) {
      return new Response(
        JSON.stringify({ error: 'URL and userId are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Perform the OWASP scan logic here
    // For now, we'll just return a mock response
    const scanResults = {
      vulnerabilities: [
        {
          vulnerability_type: "SQL Injection",
          severity: "high",
          description: "Potential SQL injection vulnerability detected",
          recommendation: "Use parameterized queries",
          owasp_category: "Injection"
        }
      ]
    }

    // Insert results into the database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabaseClient
      .from('api_security_issues')
      .insert(scanResults.vulnerabilities.map(vuln => ({
        user_id: userId,
        target_url: url,
        ...vuln
      })))

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ success: true, data: scanResults }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('OWASP scan error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})