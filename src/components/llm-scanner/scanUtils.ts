import { supabase } from "@/integrations/supabase/client";

export const handleSingleScan = async (
  prompt: string,
  selectedProvider: string,
  apiKey: string,
  customEndpoint: string,
  curlCommand: string,
  promptPlaceholder: string,
  customHeaders: string,
  selectedModel: string,
  userId: string,
  scanType: 'manual' | 'batch',
  batchId?: string | null,
  label?: string
) => {
  if (!apiKey && selectedProvider === "openai") {
    throw new Error("OpenAI API key is required");
  }

  if (selectedProvider === "custom") {
    return await handleCustomProviderScan(
      prompt,
      customEndpoint,
      curlCommand,
      promptPlaceholder,
      customHeaders,
      userId,
      scanType,
      batchId,
      label
    );
  }

  return await handleStandardProviderScan(
    prompt,
    selectedProvider,
    apiKey,
    selectedModel,
    userId,
    scanType,
    batchId,
    label
  );
};

const handleCustomProviderScan = async (
  prompt: string,
  customEndpoint: string,
  curlCommand: string,
  promptPlaceholder: string,
  customHeaders: string,
  userId: string,
  scanType: 'manual' | 'batch',
  batchId?: string | null,
  label?: string
) => {
  try {
    let response;
    if (curlCommand) {
      const headers: Record<string, string> = {};
      const curlWithPrompt = curlCommand.replace(promptPlaceholder, prompt);
      
      const headerMatches = curlWithPrompt.match(/-H "([^"]+)"/g);
      if (headerMatches) {
        headerMatches.forEach(match => {
          const [key, value] = match.slice(4, -1).split(': ');
          if (key && value) {
            headers[key] = value;
          }
        });
      }

      const bodyMatch = curlWithPrompt.match(/-d '([^']+)'/) || curlWithPrompt.match(/-d "([^"]+)"/);
      const body = bodyMatch ? bodyMatch[1] : '';

      response = await fetch(customEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body,
      });
    } else {
      const headers = customHeaders ? JSON.parse(customHeaders) : {};
      response = await fetch(customEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ prompt }),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const result = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    
    await supabase.from('llm_scan_results').insert({
      prompt,
      result,
      provider: 'custom',
      scan_type: scanType,
      batch_id: batchId || null,
      user_id: userId,
      label: label || null,
      response_status: response.status,
      raw_response: data
    });

    return result;
  } catch (error) {
    console.error("Custom provider error:", error);
    throw new Error(`Error with custom provider: ${error.message}`);
  }
};

const handleStandardProviderScan = async (
  prompt: string,
  provider: string,
  apiKey: string,
  model: string,
  userId: string,
  scanType: 'manual' | 'batch',
  batchId?: string | null,
  label?: string
) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates content based on user prompts.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  const generatedText = data.choices[0].message.content;

  await supabase.from('llm_scan_results').insert({
    prompt,
    result: generatedText,
    provider,
    model,
    scan_type: scanType,
    batch_id: batchId || null,
    user_id: userId,
    label: label || null,
    response_status: response.status,
    raw_response: data
  });

  return generatedText;
};