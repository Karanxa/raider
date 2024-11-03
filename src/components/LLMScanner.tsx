import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProviderSelect } from "./llm-scanner/ProviderSelect";
import { CustomProviderSettings } from "./llm-scanner/CustomProviderSettings";
import { PromptInput } from "./llm-scanner/PromptInput";
import { ApiKeyInput } from "./llm-scanner/ApiKeyInput";
import { useSession } from '@supabase/auth-helpers-react';

const LLMScanner = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [customHeaders, setCustomHeaders] = useState<string>("");
  const [curlCommand, setCurlCommand] = useState<string>("");
  const [promptPlaceholder, setPromptPlaceholder] = useState<string>("{{PROMPT}}");
  const [prompt, setPrompt] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string>("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [apiKey, setApiKey] = useState<string>("");
  const session = useSession();

  const handleScan = async (promptToScan: string) => {
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
          
          // Extract headers and body from curl command
          const headerMatches = curlWithPrompt.match(/-H "([^"]+)"/g) || [];
          headerMatches.forEach(match => {
            const [key, value] = match.slice(4, -1).split(': ');
            headers[key] = value;
          });

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
          scan_type: prompts.length > 0 ? 'batch' : 'manual',
          batch_id: prompts.length > 0 ? crypto.randomUUID() : null,
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
        scan_type: prompts.length > 0 ? 'batch' : 'manual',
        batch_id: prompts.length > 0 ? crypto.randomUUID() : null,
        user_id: session.user.id,
      });

      return generatedText;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };

  const processPrompts = async () => {
    if (prompts.length === 0 && !prompt) {
      toast.error("Please enter a prompt or upload a CSV file");
      return;
    }

    setScanning(true);
    try {
      if (prompts.length > 0) {
        const batchId = crypto.randomUUID();
        let allResults = "";
        for (let i = 0; i < prompts.length; i++) {
          setCurrentPromptIndex(i);
          const result = await handleScan(prompts[i]);
          allResults += `Prompt ${i + 1}: ${prompts[i]}\nResult: ${result}\n\n`;
        }
        setResult(allResults);
        setCurrentPromptIndex(0);
        toast.success("Batch processing completed");
      } else {
        const result = await handleScan(prompt);
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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <ProviderSelect
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onProviderChange={setSelectedProvider}
            onModelChange={setSelectedModel}
          />

          {selectedProvider && (
            <ApiKeyInput
              provider={selectedProvider}
              onApiKeyChange={setApiKey}
            />
          )}

          {selectedProvider === "custom" && (
            <CustomProviderSettings
              customEndpoint={customEndpoint}
              customHeaders={customHeaders}
              curlCommand={curlCommand}
              promptPlaceholder={promptPlaceholder}
              onEndpointChange={setCustomEndpoint}
              onHeadersChange={setCustomHeaders}
              onCurlCommandChange={setCurlCommand}
              onPromptPlaceholderChange={setPromptPlaceholder}
            />
          )}

          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onPromptsFromCSV={setPrompts}
          />

          <Button
            onClick={processPrompts}
            disabled={scanning}
            className="w-full"
          >
            {scanning ? (
              prompts.length > 0 
                ? `Processing prompt ${currentPromptIndex + 1} of ${prompts.length}...` 
                : "Scanning..."
            ) : (
              "Start LLM Scan"
            )}
          </Button>

          {result && (
            <Card className="p-4 mt-4">
              <h3 className="font-semibold mb-2">Scan Results</h3>
              <div className="whitespace-pre-wrap text-sm">{result}</div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LLMScanner;