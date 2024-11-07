import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  success: boolean;
  vulnerabilities: Array<{
    name: string;
    severity: string;
    description: string;
    recommendation?: string;
  }>;
}

async function testModelExtraction(endpoint: string, apiKey: string, sampleInput: string): Promise<TestResult> {
  const results = [];
  // Test for model extraction vulnerabilities
  try {
    // Make multiple queries with similar inputs to detect potential extraction
    const queries = Array(10).fill(sampleInput).map((input, i) => 
      input + " " + "variation" + i
    );
    
    const responses = await Promise.all(queries.map(query => 
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: query }),
      })
    ));

    // Analyze response patterns
    const responseTexts = await Promise.all(responses.map(r => r.text()));
    const uniqueResponses = new Set(responseTexts);
    
    if (uniqueResponses.size < responses.length * 0.5) {
      results.push({
        name: "Model Extraction Vulnerability",
        severity: "High",
        description: "Model shows signs of vulnerability to extraction attacks",
        recommendation: "Implement rate limiting and query monitoring"
      });
    }
  } catch (error) {
    console.error("Model extraction test error:", error);
  }
  
  return {
    success: true,
    vulnerabilities: results
  };
}

async function testMembershipInference(endpoint: string, apiKey: string, sampleInput: string): Promise<TestResult> {
  const results = [];
  try {
    // Test for membership inference by analyzing confidence scores
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: sampleInput }),
    });

    const data = await response.json();
    
    // Check if model returns confidence scores
    if (data.confidence || data.probability || data.scores) {
      results.push({
        name: "Membership Inference Risk",
        severity: "High",
        description: "Model exposes confidence scores that could be used for membership inference",
        recommendation: "Consider using differential privacy techniques"
      });
    }
  } catch (error) {
    console.error("Membership inference test error:", error);
  }

  return {
    success: true,
    vulnerabilities: results
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelEndpoint, apiKey, testType, sampleInput, accessMethod, userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    let testResults: TestResult = {
      success: false,
      vulnerabilities: []
    };

    // Run appropriate test based on test type
    switch (testType) {
      case "model-extraction":
        testResults = await testModelExtraction(modelEndpoint, apiKey, sampleInput);
        break;
      case "membership-inference":
        testResults = await testMembershipInference(modelEndpoint, apiKey, sampleInput);
        break;
      // Add other test implementations here
    }

    // Calculate overall risk level
    const riskLevels = {
      'Critical': 4,
      'High': 3,
      'Medium': 2,
      'Low': 1
    };

    const avgRisk = testResults.vulnerabilities.reduce((acc, vuln) => 
      acc + (riskLevels[vuln.severity as keyof typeof riskLevels] || 0), 0
    ) / (testResults.vulnerabilities.length || 1);

    let overallRisk = 'Low';
    if (avgRisk >= 3.5) overallRisk = 'Critical';
    else if (avgRisk >= 2.5) overallRisk = 'High';
    else if (avgRisk >= 1.5) overallRisk = 'Medium';

    // Store results in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('model_security_tests')
      .insert({
        user_id: userId,
        model_endpoint: modelEndpoint,
        test_type: testType,
        risk_level: overallRisk,
        vulnerabilities: testResults.vulnerabilities,
        recommendations: testResults.vulnerabilities.map(v => v.recommendation).filter(Boolean),
        test_status: 'completed'
      });

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        overallRisk,
        vulnerabilities: testResults.vulnerabilities,
        recommendations: testResults.vulnerabilities.map(v => v.recommendation).filter(Boolean)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});