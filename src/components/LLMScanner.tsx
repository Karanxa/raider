import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProviderSelect } from "./llm-scanner/ProviderSelect";
import { CustomProviderSettings } from "./llm-scanner/CustomProviderSettings";
import { PromptInput } from "./llm-scanner/PromptInput";
import { ApiKeyInput } from "./llm-scanner/ApiKeyInput";
import { useSession } from '@supabase/auth-helpers-react';
import { useScanLogic } from "./llm-scanner/useScanLogic";

const LLMScanner = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [customHeaders, setCustomHeaders] = useState<string>("");
  const [curlCommand, setCurlCommand] = useState<string>("");
  const [promptPlaceholder, setPromptPlaceholder] = useState<string>("{{PROMPT}}");
  const [prompt, setPrompt] = useState<string>("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState<string>("");
  const session = useSession();

  const { scanning, result, currentPromptIndex, processPrompts } = useScanLogic(session);

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

          {selectedProvider && selectedProvider !== "custom" && (
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
              requiresApiKey={!curlCommand} // Only require API key if not using cURL
            />
          )}

          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onPromptsFromCSV={setPrompts}
          />

          <Button
            onClick={() => processPrompts(
              prompts,
              prompt,
              selectedProvider,
              apiKey,
              customEndpoint,
              curlCommand,
              promptPlaceholder,
              customHeaders,
              selectedModel
            )}
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