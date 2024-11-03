import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProviderSelect, providers } from "./llm-scanner/ProviderSelect";
import { CustomEndpoint } from "./llm-scanner/CustomEndpoint";
import { PromptInput } from "./llm-scanner/PromptInput";

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

  const handleScan = async (promptToScan: string) => {
    if (!selectedProvider) {
      toast.error("Please select a provider");
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
        return typeof data === "string" ? data : JSON.stringify(data, null, 2);
      } catch (error) {
        console.error("Custom endpoint error:", error);
        throw new Error(`Error with custom endpoint: ${error.message}`);
      }
    }

    let data, error;

    if (selectedProvider === "openai") {
      ({ data, error } = await supabase.functions.invoke('llm-scan', {
        body: { 
          prompt: promptToScan,
          model: selectedModel || "gpt-4o-mini"
        }
      }));
    } else if (selectedProvider === "gemini") {
      ({ data, error } = await supabase.functions.invoke('gemini-scan', {
        body: { 
          prompt: promptToScan,
          model: selectedModel || "gemini-pro"
        }
      }));
    }

    if (error) throw error;
    return data.result;
  };

  const processPrompts = async () => {
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