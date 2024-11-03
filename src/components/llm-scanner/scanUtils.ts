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
  userId: string
) => {
  if (selectedProvider === "custom") {
    return await handleCustomProviderScan(
      prompt,
      customEndpoint,
      curlCommand,
      promptPlaceholder,
      customHeaders,
      userId
    );
  }

  return await handleStandardProviderScan(
    prompt,
    selectedProvider,
    apiKey,
    selectedModel,
    userId
  );
};

const handleCustomProviderScan = async (
  prompt: string,
  customEndpoint: string,
  curlCommand: string,
  promptPlaceholder: string,
  customHeaders: string,
  userId: string
) => {
  try {
    let response;
    if (curlCommand) {
      const headers: Record<string, string> = {};
      const curlWithPrompt = curlCommand.replace(promptPlaceholder, prompt);
      
      const headerMatches = curlWithPrompt.match(/-H "([^"]+)"/g);
      if (headerMatches) {
        headerMatches.forEach(match => {
          const headerContent = match.slice(4, -1);
          const [key, value] = headerContent.split(': ');
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
      scan_type: 'manual',
      user_id: userId,
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
  userId: string
) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || "gpt-4-mini",
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
    scan_type: 'manual',
    user_id: userId,
  });

  return generatedText;
};