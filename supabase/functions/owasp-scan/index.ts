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
    const { url, userId } = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Simulated OWASP tests - in a real implementation, you'd use actual security testing tools
    const owaspTests = [
      {
        category: 'Broken Access Control',
        tests: ['unauthorized_access', 'missing_authentication']
      },
      {
        category: 'Cryptographic Failures',
        tests: ['weak_encryption', 'insecure_data_transmission']
      },
      {
        category: 'Injection',
        tests: ['sql_injection', 'command_injection', 'xss']
      },
      // Add more OWASP categories and tests
    ];

    let progress = 0;
    const progressIncrement = 100 / owaspTests.length;

    for (const category of owaspTests) {
      // Simulate scanning for each test in the category
      for (const test of category.tests) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate test duration
        
        // Simulate finding vulnerabilities (random for demo)
        if (Math.random() > 0.7) {
          await supabaseAdmin
            .from('api_security_issues')
            .insert({
              user_id: userId,
              target_url: url,
              vulnerability_type: test,
              severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
              description: `Potential ${test.replace('_', ' ')} vulnerability detected`,
              recommendation: `Implement proper ${test.replace('_', ' ')} protection mechanisms`,
              owasp_category: category.category,
            });
        }
      }

      progress += progressIncrement;
      
      // Broadcast progress
      await supabaseAdmin.realtime.send({
        broadcast: {
          event: 'scan-progress',
          payload: { progress: Math.round(progress) },
        },
      });
    }

    return new Response(
      JSON.stringify({ message: 'OWASP scan completed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in OWASP scan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});