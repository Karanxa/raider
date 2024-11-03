import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

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
  setCurrentPromptIndex: (index: number) => void
) => {
  const batchId = uuidv4();
  
  for (let i = 0; i < prompts.length; i++) {
    setCurrentPromptIndex(i);
    
    let response;
    if (selectedProvider === "custom") {
      if (curlCommand) {
        const headers: Record<string, string> = {};
        const curlWithPrompt = curlCommand.replace(promptPlaceholder, prompts[i]);
        
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
          body: JSON.stringify({ prompt: prompts[i] }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      
      await supabase.from('llm_scan_results').insert({
        prompt: prompts[i],
        result,
        provider: 'custom',
        scan_type: 'batch',
        batch_id: batchId,
        user_id: userId,
      });
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
            { role: 'user', content: prompts[i] }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.choices[0].message.content;

      await supabase.from('llm_scan_results').insert({
        prompt: prompts[i],
        result,
        provider: selectedProvider,
        model: selectedModel,
        scan_type: 'batch',
        batch_id: batchId,
        user_id: userId,
      });
    }
  }

  return { batchId };
};