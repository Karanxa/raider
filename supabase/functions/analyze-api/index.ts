import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { curlCommand, userId } = await req.json()

    if (!curlCommand || !userId) {
      throw new Error('Curl command and userId are required')
    }

    // Parse curl command to extract method, headers, and body
    const method = curlCommand.match(/-X\s+(\w+)/) ? 
      curlCommand.match(/-X\s+(\w+)/)[1] : 
      curlCommand.includes('--data') ? 'POST' : 'GET'

    const headers = {}
    const headerMatches = curlCommand.match(/-H\s+["']([^"']+)["']/g)
    if (headerMatches) {
      headerMatches.forEach(match => {
        const [key, value] = match.replace(/-H\s+["']/, '').replace(/["']$/, '').split(': ')
        headers[key] = value
      })
    }

    const bodyMatch = curlCommand.match(/--data\s+['"]([^'"]+)['"]/);
    const body = bodyMatch ? bodyMatch[1] : null;

    // Analyze potential threats
    const threats = []

    // Check authentication
    if (!headers['Authorization'] && !headers['authorization']) {
      threats.push({
        severity: 'high',
        title: 'Missing Authentication',
        description: 'No authentication token found in request headers',
        recommendation: 'Add proper authentication using Bearer tokens or API keys'
      })
    }

    // Check for sensitive data in URL
    if (curlCommand.match(/password|secret|token|key/i)) {
      threats.push({
        severity: 'critical',
        title: 'Sensitive Data Exposure',
        description: 'Sensitive information detected in the URL or parameters',
        recommendation: 'Never include sensitive data in URLs. Use POST method with encrypted body instead'
      })
    }

    // Check content type for POST requests
    if (method === 'POST' && (!headers['Content-Type'] && !headers['content-type'])) {
      threats.push({
        severity: 'medium',
        title: 'Missing Content-Type',
        description: 'Content-Type header is not specified for POST request',
        recommendation: 'Always specify Content-Type header (e.g., application/json) for POST requests'
      })
    }

    // Check for HTTPS
    if (curlCommand.includes('http://')) {
      threats.push({
        severity: 'high',
        title: 'Insecure Protocol',
        description: 'Request uses HTTP instead of HTTPS',
        recommendation: 'Always use HTTPS for API communications to ensure data encryption'
      })
    }

    // Store analysis results
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseClient.from('api_security_issues').insert(
      threats.map(threat => ({
        user_id: userId,
        vulnerability_type: threat.title,
        severity: threat.severity,
        description: threat.description,
        recommendation: threat.recommendation,
        owasp_category: 'API Security',
        target_url: curlCommand.match(/curl\s+['"]([^'"]+)['"]/)?.[1] || 'Unknown'
      }))
    )

    return new Response(
      JSON.stringify({ success: true, threats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-api function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})