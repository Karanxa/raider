import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useSession } from "@supabase/auth-helpers-react";
import { ProviderSelect } from "./llm-scanner/ProviderSelect";
import { PromptInput } from "./llm-scanner/PromptInput";
import { CustomProviderSettings } from "./llm-scanner/CustomProviderSettings";
import { NotificationSettings } from "./llm-scanner/NotificationSettings";
import { CategorySelect } from "./llm-scanner/CategorySelect";
import { useScanLogic } from "./llm-scanner/useScanLogic";
import { toast } from "sonner";

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
      categories
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <ProviderSelect
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
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

          <NotificationSettings
            onScan={handleScan}
            scanning={scanning}
          />
        </div>
      </Card>
    </div>
  );
};

export default LLMScanner;