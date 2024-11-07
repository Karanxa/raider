import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useSession } from "@supabase/auth-helpers-react";
import { ProviderSelect } from "./llm-scanner/ProviderSelect";
import { PromptInput } from "./llm-scanner/PromptInput";
import { CustomProviderSettings } from "./llm-scanner/CustomProviderSettings";
import { CategorySelect } from "./llm-scanner/CategorySelect";
import { ScheduleScanner } from "./llm-scanner/ScheduleScanner";
import { useScanLogic } from "./llm-scanner/useScanLogic";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface PromptWithCategory {
  prompt: string;
  category: string;
}

const LLMScanner = () => {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [curlCommand, setCurlCommand] = useState("");
  const [promptPlaceholder, setPromptPlaceholder] = useState("");
  const [customHeaders, setCustomHeaders] = useState("");
  const [promptText, setPromptText] = useState("");
  const [category, setCategory] = useState("");
  const [prompts, setPrompts] = useState<PromptWithCategory[]>([]);
  const [label, setLabel] = useState("");
  
  const session = useSession();
  const { scanning, processPrompts } = useScanLogic(session);

  const handleScan = async () => {
    if (!category && prompts.length === 0) {
      toast.error("Please select an attack category");
      return;
    }

    const promptsList = prompts.length > 0 
      ? prompts.map(p => p.prompt)
      : [promptText];
    
    const categories = prompts.length > 0
      ? prompts.map(p => p.category)
      : [category];

    await processPrompts(
      promptsList,
      promptText,
      selectedProvider,
      apiKey,
      customEndpoint,
      curlCommand,
      promptPlaceholder,
      customHeaders,
      "",
      10,
      categories,
      label
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <ProviderSelect
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
          />

          {selectedProvider === "custom" && (
            <CustomProviderSettings
              customEndpoint={customEndpoint}
              curlCommand={curlCommand}
              promptPlaceholder={promptPlaceholder}
              customHeaders={customHeaders}
              onEndpointChange={setCustomEndpoint}
              onCurlCommandChange={setCurlCommand}
              onPromptPlaceholderChange={setPromptPlaceholder}
              onHeadersChange={setCustomHeaders}
              requiresApiKey={false}
            />
          )}

          <CategorySelect 
            category={category}
            onCategoryChange={setCategory}
          />

          <PromptInput
            prompt={promptText}
            onPromptChange={setPromptText}
            onPromptsFromCSV={setPrompts}
          />

          <div className="space-y-2">
            <Label>Label (Optional)</Label>
            <Input
              placeholder="Enter a label for this scan"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              onClick={handleScan}
              disabled={scanning}
            >
              {scanning ? "Scanning..." : "Start Scan"}
            </button>
          </div>
        </div>
      </Card>

      <ScheduleScanner
        prompt={promptText}
        provider={selectedProvider}
        model=""
        customEndpoint={customEndpoint}
        curlCommand={curlCommand}
        promptPlaceholder={promptPlaceholder}
        customHeaders={customHeaders}
        apiKey={apiKey}
      />
    </div>
  );
};

export default LLMScanner;