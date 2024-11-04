import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { ipAddress } = await req.json();
    const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] ?? '');

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gather IP intelligence data
    const [asnResponse, dnsResponse, geoResponse] = await Promise.all([
      fetch(`https://ipapi.co/${ipAddress}/json/`),
      fetch(`https://dns.google/resolve?name=${ipAddress}`),
      fetch(`https://ipapi.co/${ipAddress}/json/`)
    ]);

    const [asnData, dnsData, geoData] = await Promise.all([
      asnResponse.json(),
      dnsResponse.json(),
      geoResponse.json()
    ]);

    // Perform reverse DNS lookup
    const reverseDns = await fetch(`https://dns.google/resolve?name=${ipAddress}&type=PTR`).then(r => r.json());

    // Get MX records if available
    const mxRecords = await fetch(`https://dns.google/resolve?name=${ipAddress}&type=MX`).then(r => r.json());

    // Get nameservers
    const nameservers = await fetch(`https://dns.google/resolve?name=${ipAddress}&type=NS`).then(r => r.json());

    const result = {
      user_id: user.id,
      ip_address: ipAddress,
      asn_info: asnData,
      dns_records: dnsData,
      geolocation: geoData,
      reverse_dns: reverseDns.Answer?.[0]?.data || null,
      mx_records: mxRecords.Answer || [],
      nameservers: nameservers.Answer || [],
      whois_data: null // WHOIS data requires additional setup and potentially paid APIs
    };

    const { error: insertError } = await supabase
      .from('ip_intelligence_results')
      .insert([result]);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});