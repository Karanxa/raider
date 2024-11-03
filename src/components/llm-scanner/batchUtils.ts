import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processBatch = async (
  batch: string[],
  selectedProvider: string,
  apiKey: string,
  customEndpoint: string,
  curlCommand: string,
  promptPlaceholder: string,
  customHeaders: string,
  selectedModel: string,
  userId: string,
  batchId: string,
  setCurrentPromptIndex: (index: number) => void
) => {
  const results = await Promise.all(
    batch.map(async (prompt, index) => {
      let response;
      if (selectedProvider === "custom") {
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
        return {
          prompt,
          result: typeof data === "string" ? data : JSON.stringify(data, null, 2),
          provider: 'custom'
        };
      } else {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel || "gpt-4-mini",
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
        return {
          prompt,
          result: data.choices[0].message.content,
          provider: selectedProvider,
          model: selectedModel
        };
      }
    })
  );

  // Store results in database
  for (const result of results) {
    await supabase.from('llm_scan_results').insert({
      prompt: result.prompt,
      result: result.result,
      provider: result.provider,
      model: result.model,
      scan_type: 'batch',
      batch_id: batchId,
      user_id: userId,
    });
  }
};

export const handleBatchScan = async (
  prompts: string[],
  selectedProvider: string,
  apiKey: string,
  customEndpoint: string,
  curlCommand: string,
  promptPlaceholder: string,
  customHeaders: string,
  selectedModel: string,
  userId: string,
  setCurrentPromptIndex: (index: number) => void,
  qps: number = 10
) => {
  const batchId = uuidv4();
  const batchSize = qps;
  const delayBetweenBatches = 1000; // 1 second delay between batches

  // Split prompts into batches
  const batches: string[][] = [];
  for (let i = 0; i < prompts.length; i += batchSize) {
    batches.push(prompts.slice(i, i + batchSize));
  }

  // Process batches with rate limiting
  for (let i = 0; i < batches.length; i++) {
    setCurrentPromptIndex(i * batchSize);
    
    await processBatch(
      batches[i],
      selectedProvider,
      apiKey,
      customEndpoint,
      curlCommand,
      promptPlaceholder,
      customHeaders,
      selectedModel,
      userId,
      batchId,
      setCurrentPromptIndex
    );

    // Add delay between batches if not the last batch
    if (i < batches.length - 1) {
      await sleep(delayBetweenBatches);
    }
  }

  return { batchId };
};