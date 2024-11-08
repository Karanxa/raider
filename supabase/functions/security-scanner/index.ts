import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleGithubScan } from './handlers/github-handler.ts';
import { handleDomainRecon } from './handlers/domain-handler.ts';
import { handleIPIntelligence } from './handlers/ip-handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, ...params } = await req.json();
    
    switch (operation) {
      case 'domain-recon':
        return await handleDomainRecon(params);
      case 'scan-github-repos':
        return await handleGithubScan(params);
      case 'ip-intelligence':
        return await handleIPIntelligence(params);
      default:
        throw new Error('Invalid operation specified');
    }
  } catch (error) {
    console.error('Error in security-scanner:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});