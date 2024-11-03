import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NUCLEI_API_URL = Deno.env.get('NUCLEI_API_URL');
const NUCLEI_API_KEY = Deno.env.get('NUCLEI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { domains, userId } = await req.json()
    console.log('Received scan request for domains:', domains)

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Convert domains to URLs if they don't start with http
    const urls = domains.map((domain: string) => 
      domain.startsWith('http') ? domain : `http://${domain}`
    )

    // Send scan request to Nuclei server
    const scanResponse = await fetch(NUCLEI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NUCLEI_API_KEY}`,
      },
      body: JSON.stringify({ urls }),
    })

    if (!scanResponse.ok) {
      throw new Error(`Nuclei scan failed: ${scanResponse.statusText}`)
    }

    const scanResults = await scanResponse.json()
    console.log('Received scan results:', scanResults)

    // Store results in database
    const { data, error } = await supabaseAdmin
      .from('nuclei_scan_results')
      .insert(
        scanResults.map((result: any) => ({
          domain: result.domain,
          url: result.url,
          template_id: result.template_id,
          severity: result.severity,
          finding_name: result.name,
          finding_description: result.description,
          matched_at: result.matched_at,
          user_id: userId,
        }))
      )

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Scan completed', results: scanResults }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in nuclei-scan function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})