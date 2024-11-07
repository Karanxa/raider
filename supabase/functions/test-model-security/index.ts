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
    details?: any;
  }>;
}

async function testModelExtraction(endpoint: string, apiKey: string, sampleInput: string): Promise<TestResult> {
  const results = [];
  console.log("Starting model extraction test...");
  
  try {
    // 1. Query Space Analysis Attack
    // Send multiple queries with slight variations to analyze response space
    const queryVariations = [
      sampleInput,
      sampleInput.toUpperCase(),
      sampleInput.toLowerCase(),
      sampleInput.split('').reverse().join(''),
      sampleInput + " additional context",
      "prefix " + sampleInput,
    ];
    
    console.log("Performing query space analysis...");
    const responses = await Promise.all(queryVariations.map(query => 
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: query }),
      }).then(r => r.text())
    ));

    // Analyze response patterns
    const uniqueResponses = new Set(responses);
    const responseVariability = uniqueResponses.size / responses.length;
    
    if (responseVariability < 0.5) {
      results.push({
        name: "Low Response Variability",
        severity: "High",
        description: "Model shows signs of limited output variation, making it vulnerable to extraction attacks",
        recommendation: "Implement response randomization and output diversity",
        details: {
          responseVariability,
          uniqueResponseCount: uniqueResponses.size,
          totalQueries: responses.length
        }
      });
    }

    // 2. Boundary Testing Attack
    // Test model behavior at input boundaries
    console.log("Performing boundary testing...");
    const boundaryTests = [
      "", // Empty input
      "a".repeat(1000), // Very long input
      JSON.stringify({malformed: "input"}), // Structured input
      "<script>alert('test')</script>", // Injection attempt
    ];

    const boundaryResponses = await Promise.all(boundaryTests.map(test =>
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: test }),
      }).then(r => r.text()).catch(e => e.toString())
    ));

    // Check for error handling consistency
    const errorResponses = boundaryResponses.filter(r => r.includes("error"));
    if (errorResponses.length < boundaryTests.length / 2) {
      results.push({
        name: "Inconsistent Error Handling",
        severity: "Medium",
        description: "Model doesn't properly handle edge cases, potentially exposing internal behavior",
        recommendation: "Implement consistent error handling and input validation",
        details: {
          errorResponseCount: errorResponses.length,
          totalBoundaryTests: boundaryTests.length
        }
      });
    }

    // 3. Token Probability Analysis
    // Analyze token probability distributions
    console.log("Performing token probability analysis...");
    const probeInputs = Array(5).fill(sampleInput).map((input, i) => 
      input + ` ${i}`
    );

    const probeResponses = await Promise.all(probeInputs.map(probe =>
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          input: probe,
          return_probabilities: true // Note: This depends on API support
        }),
      }).then(r => r.json()).catch(() => null)
    ));

    // Check if probability information is exposed
    const hasDetailedProbabilities = probeResponses.some(r => 
      r && (r.probabilities || r.logits || r.scores)
    );

    if (hasDetailedProbabilities) {
      results.push({
        name: "Exposed Probability Information",
        severity: "Critical",
        description: "Model exposes detailed token probabilities, facilitating model extraction",
        recommendation: "Disable probability/logit output in production endpoints",
        details: {
          exposedProbabilityCount: probeResponses.filter(r => r && (r.probabilities || r.logits || r.scores)).length
        }
      });
    }

  } catch (error) {
    console.error("Model extraction test error:", error);
    results.push({
      name: "Test Execution Error",
      severity: "Info",
      description: "Error occurred during model extraction testing",
      details: { error: error.toString() }
    });
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

    console.log(`Starting ${testType} test for endpoint: ${modelEndpoint}`);

    switch (testType) {
      case "model-extraction":
        testResults = await testModelExtraction(modelEndpoint, apiKey, sampleInput);
        break;
      case "membership-inference":
        testResults = await testMembershipInference(modelEndpoint, apiKey, sampleInput);
        break;
      default:
        throw new Error(`Unsupported test type: ${testType}`);
    }

    // Calculate risk level based on vulnerabilities
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

    console.log(`Test completed. Risk level: ${overallRisk}`);

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