import { useState } from "react";
import { useSession } from '@supabase/auth-helpers-react';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProviderSelect } from "./llm-scanner/ProviderSelect";
import { CustomProviderSettings } from "./llm-scanner/CustomProviderSettings";
import { PromptInput } from "./llm-scanner/PromptInput";
import { ScheduleScanner } from "./llm-scanner/ScheduleScanner";
import { useScanLogic } from "./llm-scanner/useScanLogic";
import { useApiKeys } from "@/hooks/useApiKeys";
import { AttackCategorySelect } from "./llm-scanner/AttackCategorySelect";

const LLMScanner = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [customHeaders, setCustomHeaders] = useState<string>("");
  const [curlCommand, setCurlCommand] = useState<string>("");
  const [promptPlaceholder, setPromptPlaceholder] = useState<string>("{{PROMPT}}");
  const [prompt, setPrompt] = useState<string>("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [qps, setQps] = useState<number>(10);
  const [scanLabel, setScanLabel] = useState<string>("");
  const [attackCategory, setAttackCategory] = useState<string>("");
  const session = useSession();
  const navigate = useNavigate();
  const { getApiKey } = useApiKeys();

  const { scanning, result, currentPromptIndex, processPrompts, batchId } = useScanLogic(session);

  const handleViewResults = () => {
    if (batchId) {
      navigate('/results', { state: { batchId } });
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

  const handleScan = async () => {
    if (!attackCategory && !prompts.length) {
      toast.error("Please select an attack category");
      return;
    }

    try {
      if (selectedProvider !== "custom") {
        const storedApiKey = getApiKey(selectedProvider);
        if (!storedApiKey) {
          toast.error(`Please add your ${selectedProvider} API key in Settings`);
          return;
        }
        await processPrompts(
          prompts,
          prompt,
          selectedProvider,
          storedApiKey,
          customEndpoint,
          curlCommand,
          promptPlaceholder,
          customHeaders,
          selectedModel,
          qps,
          scanLabel,
          attackCategory
        );
      } else {
        await processPrompts(
          prompts,
          prompt,
          selectedProvider,
          "",
          customEndpoint,
          curlCommand,
          promptPlaceholder,
          customHeaders,
          selectedModel,
          qps,
          scanLabel,
          attackCategory
        );
      }
      
      if (prompts.length > 0) {
        toast.success("Batch scan completed successfully");
      } else {
        toast.success("Scan completed successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete scan");
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

          {!prompts.length && (
            <AttackCategorySelect
              value={attackCategory}
              onValueChange={setAttackCategory}
            />
          )}

          <div className="space-y-2">
            <Label>Scan Label (Optional)</Label>
            <Input
              type="text"
              value={scanLabel}
              onChange={(e) => setScanLabel(e.target.value)}
              placeholder="Enter a label for this scan"
            />
            <p className="text-sm text-muted-foreground">
              If provided, all prompts in this scan will be tagged with this label
            </p>
          </div>

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
            onClick={handleScan}
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
            apiKey={getApiKey(selectedProvider) || ""}
          />
        </div>
      </Card>
    </div>
  );
};

export default LLMScanner;