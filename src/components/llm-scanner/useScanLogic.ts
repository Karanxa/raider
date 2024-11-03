import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useScanLogic = (session: any) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string>("");
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);

  const handleScan = async (
    promptToScan: string,
    selectedProvider: string,
    apiKey: string,
    customEndpoint: string,
    curlCommand: string,
    promptPlaceholder: string,
    customHeaders: string,
    selectedModel: string
  ) => {
    if (!selectedProvider) {
      toast.error("Please select a provider");
      return;
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to run scans");
      return;
    }

    if (selectedProvider === "custom") {
      if (!customEndpoint && !curlCommand) {
        toast.error("Please enter either a custom endpoint URL or a cURL command");
        return;
      }

      try {
        let response;
        if (curlCommand) {
          // Parse and execute curl command
          const headers: Record<string, string> = {};
          const curlWithPrompt = curlCommand.replace(
            promptPlaceholder,
            promptToScan
          );
          
          // Extract headers from curl command
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
            body: JSON.stringify({ prompt: promptToScan }),
          });
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const result = typeof data === "string" ? data : JSON.stringify(data, null, 2);
        
        await supabase.from('llm_scan_results').insert({
          prompt: promptToScan,
          result,
          provider: 'custom',
          scan_type: 'manual',
          user_id: session.user.id,
        });

        return result;
      } catch (error) {
        console.error("Custom provider error:", error);
        throw new Error(`Error with custom provider: ${error.message}`);
      }
    }

    if (!apiKey) {
      toast.error("Please enter your API key");
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel || "gpt-4o-mini",
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates content based on user prompts.' },
            { role: 'user', content: promptToScan }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content;

      await supabase.from('llm_scan_results').insert({
        prompt: promptToScan,
        result: generatedText,
        provider: selectedProvider,
        model: selectedModel,
        scan_type: 'manual',
        user_id: session.user.id,
      });

      return generatedText;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };

  const processPrompts = async (
    prompts: string[],
    prompt: string,
    selectedProvider: string,
    apiKey: string,
    customEndpoint: string,
    curlCommand: string,
    promptPlaceholder: string,
    customHeaders: string,
    selectedModel: string
  ) => {
    if (prompts.length === 0 && !prompt) {
      toast.error("Please enter a prompt or upload a CSV file");
      return;
    }

    setScanning(true);
    try {
      if (prompts.length > 0) {
        let allResults = "";
        for (let i = 0; i < prompts.length; i++) {
          setCurrentPromptIndex(i);
          const result = await handleScan(
            prompts[i],
            selectedProvider,
            apiKey,
            customEndpoint,
            curlCommand,
            promptPlaceholder,
            customHeaders,
            selectedModel
          );
          allResults += `Prompt ${i + 1}: ${prompts[i]}\nResult: ${result}\n\n`;
        }
        setResult(allResults);
        setCurrentPromptIndex(0);
        toast.success("Batch processing completed");
      } else {
        const result = await handleScan(
          prompt,
          selectedProvider,
          apiKey,
          customEndpoint,
          curlCommand,
          promptPlaceholder,
          customHeaders,
          selectedModel
        );
        setResult(result);
        toast.success("Scan completed");
      }
    } catch (error) {
      console.error('LLM scan error:', error);
      toast.error(`Error during scan: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  return {
    scanning,
    result,
    currentPromptIndex,
    processPrompts
  };
};