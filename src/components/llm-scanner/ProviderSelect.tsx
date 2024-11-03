import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const providers = {
  openai: {
    name: "OpenAI",
    models: ["gpt-4o-mini", "gpt-4o"],
  },
  gemini: {
    name: "Google Gemini",
    models: ["gemini-pro", "gemini-pro-vision"],
  },
  custom: {
    name: "Custom Endpoint",
    models: [],
  },
};

interface ProviderSelectProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

export const ProviderSelect = ({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
}: ProviderSelectProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Select Provider</Label>
        <Select
          value={selectedProvider}
          onValueChange={(value) => {
            onProviderChange(value);
            onModelChange("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(providers).map(([key, provider]) => (
              <SelectItem key={key} value={key}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProvider && selectedProvider !== "custom" && (
        <div className="space-y-2">
          <Label>Select Model</Label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {providers[selectedProvider].models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
};