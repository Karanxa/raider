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
  label?: string,
  attackCategory?: string
) => {
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
      label,
      attackCategory
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
    label,
    attackCategory
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
  label?: string,
  attackCategory?: string
) => {
  try {
    let response;
    let headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    let body: string;

    if (curlCommand) {
      // Parse headers from curl command
      const headerMatches = curlCommand.match(/-H ["']([^"']+)["']/g);
      if (headerMatches) {
        headerMatches.forEach(match => {
          const headerContent = match.slice(3, -1);
          const [key, value] = headerContent.split(': ');
          if (key && value) {
            headers[key] = value;
          }
        });
      }

      // Parse body from curl command
      const bodyMatch = curlCommand.match(/-d ['"]([^'"]+)['"]/);
      body = bodyMatch ? bodyMatch[1].replace(promptPlaceholder, prompt) : JSON.stringify({ prompt });
    } else {
      // Use custom headers if provided
      if (customHeaders) {
        try {
          headers = { ...headers, ...JSON.parse(customHeaders) };
        } catch (error) {
          console.error('Error parsing custom headers:', error);
        }
      }
      body = JSON.stringify({ prompt });
    }

    response = await fetch(customEndpoint, {
      method: "POST",
      headers,
      body
    });

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
      user_id: userId,
      batch_id: batchId || null,
      label: label || null,
      response_status: response.status,
      raw_response: data,
      attack_category: attackCategory || null
    });

    return result;
  } catch (error) {
    console.error("Custom provider error:", error);
    throw error;
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
  label?: string,
  attackCategory?: string
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
    throw new Error(`API error: ${response.statusText}`);
  }

  const data = await response.json();
  const generatedText = data.choices[0].message.content;

  await supabase.from('llm_scan_results').insert({
    prompt,
    result: generatedText,
    provider,
    model,
    scan_type: scanType,
    user_id: userId,
    batch_id: batchId || null,
    label: label || null,
    response_status: response.status,
    raw_response: data,
    attack_category: attackCategory || null
  });

  return generatedText;
};