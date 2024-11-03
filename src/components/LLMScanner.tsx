import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProviderSelect, providers } from "./llm-scanner/ProviderSelect";
import { CustomEndpoint } from "./llm-scanner/CustomEndpoint";
import { PromptInput } from "./llm-scanner/PromptInput";
import { useSession } from '@supabase/auth-helpers-react';

const LLMScanner = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [customHeaders, setCustomHeaders] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string>("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [apiKey, setApiKey] = useState<string>("");
  const session = useSession();

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage whenever it changes
  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('openai_api_key', newKey);
  };

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
      if (!customEndpoint) {
        toast.error("Please enter a custom endpoint URL");
        return;
      }

      try {
        const headers = customHeaders ? JSON.parse(customHeaders) : {};
        
        const response = await fetch(customEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({ prompt: promptToScan }),
        });

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
        console.error("Custom endpoint error:", error);
        throw new Error(`Error with custom endpoint: ${error.message}`);
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
        throw new Error(`OpenAI API error: ${response.statusText}`);
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
      console.error('OpenAI API error:', error);
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
          <div className="space-y-2">
            <Label>OpenAI API Key</Label>
            <Input
              type="password"
              placeholder="Enter your OpenAI API key"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your API key is stored locally in your browser
            </p>
          </div>

          <ProviderSelect
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onProviderChange={setSelectedProvider}
            onModelChange={setSelectedModel}
          />

          {selectedProvider === "custom" && (
            <CustomEndpoint
              customEndpoint={customEndpoint}
              customHeaders={customHeaders}
              onEndpointChange={setCustomEndpoint}
              onHeadersChange={setCustomHeaders}
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