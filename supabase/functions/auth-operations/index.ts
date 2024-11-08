import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      case 'invite-user':
        return await handleInviteUser(params);
      case 'exchange-token':
        return await handleExchangeToken(params);
      default:
        throw new Error('Invalid operation specified');
    }
  } catch (error) {
    console.error('Error in auth-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleInviteUser({ email, role }) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: user, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
  if (inviteError) throw inviteError;

  if (role) {
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: user.id, role });
    if (roleError) throw roleError;
  }

  return new Response(
    JSON.stringify({ message: 'User invited successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleExchangeToken({ code }) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
      grant_type: 'authorization_code',
      redirect_uri: `${Deno.env.get('SUPABASE_URL')}/auth/v1/callback`
    })
  });

  const tokens = await tokenResponse.json();
  return new Response(
    JSON.stringify(tokens),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}