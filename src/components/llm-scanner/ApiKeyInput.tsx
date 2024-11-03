import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";

interface ApiKeyInputProps {
  provider: string;
  onApiKeyChange: (key: string) => void;
}

export const ApiKeyInput = ({ provider, onApiKeyChange }: ApiKeyInputProps) => {
  const { getApiKey } = useApiKeys();

  useEffect(() => {
    const savedKey = getApiKey(provider);
    if (savedKey) {
      onApiKeyChange(savedKey);
    }
  }, [provider]);

  return (
    <div className="space-y-2">
      <Label>{provider.charAt(0).toUpperCase() + provider.slice(1)} API Key</Label>
      <Input
        type="password"
        placeholder={`Enter your ${provider} API key`}
        onChange={(e) => onApiKeyChange(e.target.value)}
        defaultValue={getApiKey(provider) || ""}
      />
      <p className="text-sm text-muted-foreground">
        You can manage your API keys in the Settings page or override them here
      </p>
    </div>
  );
};