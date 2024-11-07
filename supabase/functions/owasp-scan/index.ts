import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function performSecurityCheck(url: string) {
  console.log('Starting security check for URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'SecurityScanner/1.0' }
    });

    const vulnerabilities = [];
    const headers = response.headers;
    
    // Security Headers Check
    if (!headers.get('x-frame-options')) {
      vulnerabilities.push({
        vulnerability_type: "Missing X-Frame-Options",
        severity: "medium",
        description: "X-Frame-Options header is missing, potentially exposing the site to clickjacking attacks",
        recommendation: "Add X-Frame-Options header with DENY or SAMEORIGIN value",
        owasp_category: "A05:2021 – Security Misconfiguration"
      });
    }

    if (!headers.get('strict-transport-security')) {
      vulnerabilities.push({
        vulnerability_type: "Missing HSTS",
        severity: "high",
        description: "HTTP Strict Transport Security header is missing, potentially exposing the site to protocol downgrade attacks",
        recommendation: "Implement HSTS with appropriate max-age",
        owasp_category: "A05:2021 – Security Misconfiguration"
      });
    }

    if (!headers.get('content-security-policy')) {
      vulnerabilities.push({
        vulnerability_type: "Missing CSP",
        severity: "high",
        description: "Content Security Policy header is missing, increasing risk of XSS attacks",
        recommendation: "Implement a strict Content Security Policy",
        owasp_category: "A03:2021 – Injection"
      });
    }

    // SSL/TLS Check
    if (!url.startsWith('https://')) {
      vulnerabilities.push({
        vulnerability_type: "Insecure Protocol",
        severity: "critical",
        description: "The endpoint is not using HTTPS",
        recommendation: "Enable HTTPS for all endpoints",
        owasp_category: "A02:2021 – Cryptographic Failures"
      });
    }

    console.log('Found vulnerabilities:', vulnerabilities);
    return vulnerabilities;
  } catch (error) {
    console.error('Error during security check:', error);
    throw new Error(`Failed to scan URL: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { url, userId } = await req.json();
    console.log('Received scan request for URL:', url, 'from user:', userId);

    if (!url || !userId) {
      return new Response(
        JSON.stringify({ error: 'URL and userId are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const vulnerabilities = await performSecurityCheck(url);
    
    // Insert results into database
    const { error: insertError } = await supabaseClient
      .from('api_security_issues')
      .insert(vulnerabilities.map(vuln => ({
        user_id: userId,
        target_url: url,
        ...vuln,
        finding_id: crypto.randomUUID() // Generate a UUID for finding_id
      })));

    if (insertError) {
      console.error('Error inserting results:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Found ${vulnerabilities.length} potential security issues`,
        data: vulnerabilities
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('OWASP scan error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});