import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProviderSelect } from "./llm-scanner/ProviderSelect";
import { CustomProviderSettings } from "./llm-scanner/CustomProviderSettings";
import { PromptInput } from "./llm-scanner/PromptInput";
import { ApiKeyInput } from "./llm-scanner/ApiKeyInput";
import { ScheduleScanner } from "./llm-scanner/ScheduleScanner";
import { useSession } from '@supabase/auth-helpers-react';
import { useScanLogic } from "./llm-scanner/useScanLogic";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  const [qps, setQps] = useState<number>(10);
  const session = useSession();
  const navigate = useNavigate();

  const { scanning, result, currentPromptIndex, processPrompts, batchId } = useScanLogic(session);

  const handleViewResults = () => {
    if (batchId) {
      navigate('/results');
    }
  };

  const handleQpsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (value > 0) {
      setQps(value);
    } else {
      toast.error("QPS must be greater than 0");
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
              requiresApiKey={!curlCommand}
            />
          )}

          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onPromptsFromCSV={setPrompts}
          />

          {prompts.length > 0 && (
            <div className="space-y-2">
              <Label>Queries Per Second (QPS)</Label>
              <Input
                type="number"
                min="1"
                value={qps}
                onChange={handleQpsChange}
                placeholder="Enter QPS rate (e.g., 10)"
              />
              <p className="text-sm text-muted-foreground">
                Limit the rate of API requests per second
              </p>
            </div>
          )}

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
              selectedModel,
              qps
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

          {batchId ? (
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={handleViewResults}
            >
              View Batch Results
            </Button>
          ) : result && (
            <Card className="p-4 mt-4">
              <h3 className="font-semibold mb-2">Scan Results</h3>
              <div className="whitespace-pre-wrap text-sm">{result}</div>
            </Card>
          )}

          <ScheduleScanner
            prompt={prompt}
            provider={selectedProvider}
            model={selectedModel}
            customEndpoint={customEndpoint}
            curlCommand={curlCommand}
            promptPlaceholder={promptPlaceholder}
            customHeaders={customHeaders}
            apiKey={apiKey}
          />
        </div>
      </Card>
    </div>
  );
};

export default LLMScanner;