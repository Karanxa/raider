import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert security analyst specializing in threat modeling and security architecture review. Your task is to analyze the provided document and identify potential security threats, recommend security controls, and provide specific recommendations. Focus on:

1. Architecture-specific threats and vulnerabilities
2. Data flow security concerns
3. Authentication and authorization weaknesses
4. Infrastructure security considerations
5. API security risks
6. Third-party integration risks
7. Compliance and regulatory requirements

Format your response as a JSON object with these exact keys:
{
  "threats": ["array of identified threats"],
  "securityControls": ["array of recommended security controls"],
  "recommendations": ["array of specific recommendations"]
}

Be specific and detailed in your analysis, avoiding generic responses.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string;

    if (!file || !apiKey) {
      throw new Error('File and API key are required');
    }

    // Convert file to base64 for better handling
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    console.log('Processing file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      contentLength: base64Content.length
    });

    // Decode base64 content to text
    const decoder = new TextDecoder();
    const fileContent = decoder.decode(Uint8Array.from(atob(base64Content), c => c.charCodeAt(0)));

    if (!fileContent) {
      throw new Error('File content is empty');
    }

    // Send to OpenAI for analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Analyze this document for security threats:\n\n${fileContent}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-document function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process document analysis request'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});