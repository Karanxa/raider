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

    // Enhanced IP intelligence gathering
    const [
      asnResponse,
      dnsResponse,
      geoResponse,
      reverseDnsResponse,
      mxResponse,
      nsResponse,
      txtResponse,
      aResponse,
      aaaaResponse,
      whoisResponse
    ] = await Promise.all([
      fetch(`https://ipapi.co/${ipAddress}/json/`),
      fetch(`https://dns.google/resolve?name=${ipAddress}`),
      fetch(`https://ipwhois.app/json/${ipAddress}`), // More detailed geolocation
      fetch(`https://dns.google/resolve?name=${ipAddress}&type=PTR`),
      fetch(`https://dns.google/resolve?name=${ipAddress}&type=MX`),
      fetch(`https://dns.google/resolve?name=${ipAddress}&type=NS`),
      fetch(`https://dns.google/resolve?name=${ipAddress}&type=TXT`),
      fetch(`https://dns.google/resolve?name=${ipAddress}&type=A`),
      fetch(`https://dns.google/resolve?name=${ipAddress}&type=AAAA`),
      fetch(`https://whois.whoisxmlapi.com/api/v1?apiKey=${Deno.env.get('WHOIS_API_KEY')}&domainName=${ipAddress}`)
    ]);

    const [
      asnData,
      dnsData,
      geoData,
      reverseDnsData,
      mxData,
      nsData,
      txtData,
      aData,
      aaaaData,
      whoisData
    ] = await Promise.all([
      asnResponse.json(),
      dnsResponse.json(),
      geoResponse.json(),
      reverseDnsResponse.json(),
      mxResponse.json(),
      nsResponse.json(),
      txtResponse.json(),
      aResponse.json(),
      aaaaResponse.json(),
      whoisResponse.json()
    ]);

    // Enhanced result object with more detailed information
    const result = {
      user_id: user.id,
      ip_address: ipAddress,
      asn_info: {
        ...asnData,
        asn: asnData.asn,
        asn_org: asnData.org,
        network: asnData.network,
      },
      dns_records: {
        a_records: aData.Answer || [],
        aaaa_records: aaaaData.Answer || [],
        txt_records: txtData.Answer || [],
        standard: dnsData.Answer || [],
      },
      geolocation: {
        ...geoData,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        city: geoData.city,
        region: geoData.region,
        country: geoData.country,
        timezone: geoData.timezone,
        isp: geoData.isp,
      },
      reverse_dns: reverseDnsData.Answer?.[0]?.data || null,
      mx_records: mxData.Answer || [],
      nameservers: nsData.Answer || [],
      whois_data: whoisData,
      scan_timestamp: new Date().toISOString()
    };

    console.log('Gathered IP intelligence:', result);

    const { error: insertError } = await supabase
      .from('ip_intelligence_results')
      .insert([result]);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
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