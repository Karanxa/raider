import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { curlCommand, userId } = await req.json();

    if (!curlCommand || !userId) {
      throw new Error('Curl command and userId are required');
    }

    const findings = [];

    // Check for HTTP instead of HTTPS
    if (curlCommand.includes('http://')) {
      findings.push({
        severity: 'high',
        issue: 'Insecure Protocol Usage',
        description: 'The API endpoint uses HTTP instead of HTTPS, making it vulnerable to man-in-the-middle attacks.',
        recommendation: 'Use HTTPS for all API endpoints to ensure data encryption in transit.'
      });
    }

    // Check for missing or weak authentication
    if (!curlCommand.toLowerCase().includes('authorization:')) {
      findings.push({
        severity: 'high',
        issue: 'Missing Authentication',
        description: 'No authentication header found in the request.',
        recommendation: 'Implement proper authentication using Bearer tokens or API keys.'
      });
    } else if (curlCommand.toLowerCase().includes('basic ')) {
      findings.push({
        severity: 'medium',
        issue: 'Basic Authentication Usage',
        description: 'Basic authentication is being used, which is less secure than token-based authentication.',
        recommendation: 'Consider using JWT or OAuth 2.0 for authentication.'
      });
    }

    // Check for sensitive data in URL
    const sensitiveParams = ['password', 'token', 'key', 'secret', 'auth'];
    const urlMatch = curlCommand.match(/'([^']*)'|"([^"]*)"/);
    if (urlMatch) {
      const url = urlMatch[1] || urlMatch[2];
      const hasQueryParams = url.includes('?');
      if (hasQueryParams) {
        const queryString = url.split('?')[1];
        sensitiveParams.forEach(param => {
          if (queryString.toLowerCase().includes(param)) {
            findings.push({
              severity: 'high',
              issue: 'Sensitive Data in URL',
              description: `Sensitive parameter '${param}' found in URL query string.`,
              recommendation: 'Move sensitive data to request headers or body.'
            });
          }
        });
      }
    }

    // Check Content-Type header for POST requests
    if (curlCommand.includes('-X POST') || curlCommand.includes('--request POST')) {
      if (!curlCommand.toLowerCase().includes('content-type:')) {
        findings.push({
          severity: 'low',
          issue: 'Missing Content-Type Header',
          description: 'POST request without Content-Type header.',
          recommendation: 'Add appropriate Content-Type header (e.g., application/json).'
        });
      }
    }

    // Store findings in database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    for (const finding of findings) {
      await supabaseClient
        .from('api_security_issues')
        .insert({
          user_id: userId,
          vulnerability_type: finding.issue,
          severity: finding.severity,
          description: finding.description,
          recommendation: finding.recommendation,
          target_url: urlMatch ? urlMatch[1] || urlMatch[2] : null
        });
    }

    return new Response(
      JSON.stringify({ findings }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in analyze-api function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});