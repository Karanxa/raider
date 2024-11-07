import { supabase } from "@/integrations/supabase/client";
import { generateStructuredReport } from "./generateStructuredReport";

const SYSTEM_PROMPT = `You are a security vulnerability report analyzer and formatter. Your task is to analyze the provided vulnerability description and generate a well-structured report with the following sections:

1. Title: A clear, concise title that describes the vulnerability
2. Description: A detailed explanation of the vulnerability
3. Steps to Reproduce: Clear, numbered steps to reproduce the vulnerability
4. Impact: Analysis of the potential security impact and consequences
5. Proof of Concept: Any evidence or demonstration of the vulnerability
6. Recommendations: Specific recommendations for mitigation

Format the response as a JSON object with these exact keys:
{
  "title": "string",
  "description": "string",
  "steps_to_reproduce": "string (with numbered steps)",
  "impact": "string",
  "proof_of_concept": "string",
  "recommendations": "string"
}`;

export const generateAIReport = async (summary: string, severity: string, apiKey: string) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Generate a security vulnerability report for the following description. Consider this a ${severity} severity issue:\n\n${summary}` 
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI report');
    }

    const data = await response.json();
    const aiReport = JSON.parse(data.choices[0].message.content);
    return {
      ...aiReport,
      severity
    };
  } catch (error) {
    console.error('Error generating AI report:', error);
    // Fallback to basic report generation if AI fails
    return generateStructuredReport(summary, severity);
  }
};