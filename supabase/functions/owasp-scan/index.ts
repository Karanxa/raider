import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function performSecurityCheck(url: string) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'SecurityScanner/1.0' }
    });

    const vulnerabilities = [];
    
    // Check for security headers
    const headers = response.headers;
    if (!headers.get('x-frame-options')) {
      vulnerabilities.push({
        vulnerability_type: "Missing Security Headers",
        severity: "medium",
        description: "X-Frame-Options header is missing, potentially exposing the site to clickjacking attacks",
        recommendation: "Add X-Frame-Options header with DENY or SAMEORIGIN value",
        owasp_category: "Security Misconfiguration"
      });
    }

    if (!headers.get('strict-transport-security')) {
      vulnerabilities.push({
        vulnerability_type: "Missing HSTS",
        severity: "high",
        description: "HTTP Strict Transport Security header is missing, potentially exposing the site to protocol downgrade attacks",
        recommendation: "Implement HSTS with appropriate max-age",
        owasp_category: "Security Misconfiguration"
      });
    }

    if (!headers.get('content-security-policy')) {
      vulnerabilities.push({
        vulnerability_type: "Missing CSP",
        severity: "high",
        description: "Content Security Policy header is missing, increasing risk of XSS attacks",
        recommendation: "Implement a strict Content Security Policy",
        owasp_category: "Cross-Site Scripting (XSS)"
      });
    }

    // Check for SSL/TLS
    if (!url.startsWith('https://')) {
      vulnerabilities.push({
        vulnerability_type: "Insecure Protocol",
        severity: "critical",
        description: "The API endpoint is not using HTTPS",
        recommendation: "Enable HTTPS for all API endpoints",
        owasp_category: "Sensitive Data Exposure"
      });
    }

    return vulnerabilities;
  } catch (error) {
    console.error('Error scanning URL:', error);
    throw new Error('Failed to scan URL: ' + error.message);
  }
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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting OWASP scan for URL:', url);
    
    // Perform the actual security checks
    const vulnerabilities = await performSecurityCheck(url);
    
    console.log('Found vulnerabilities:', vulnerabilities);

    // Insert results into database
    const { error: insertError } = await supabaseClient
      .from('api_security_issues')
      .insert(vulnerabilities.map(vuln => ({
        user_id: userId,
        target_url: url,
        ...vuln
      })))

    if (insertError) {
      console.error('Error inserting results:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: vulnerabilities,
        message: `Found ${vulnerabilities.length} potential security issues`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('OWASP scan error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})