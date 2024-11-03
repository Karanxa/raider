import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface ApiKeyInputProps {
  provider: string;
  onApiKeyChange: (key: string) => void;
}

export const ApiKeyInput = ({ provider, onApiKeyChange }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    const savedKey = localStorage.getItem(`${provider}_api_key`);
    if (savedKey) {
      setApiKey(savedKey);
      onApiKeyChange(savedKey);
    } else {
      setApiKey("");
      onApiKeyChange("");
    }
  }, [provider]);

  const handleKeyChange = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem(`${provider}_api_key`, newKey);
    onApiKeyChange(newKey);
  };

  if (!provider || provider === "") return null;

  return (
    <div className="space-y-2">
      <Label>{provider.charAt(0).toUpperCase() + provider.slice(1)} API Key</Label>
      <Input
        type="password"
        placeholder={`Enter your ${provider} API key`}
        value={apiKey}
        onChange={(e) => handleKeyChange(e.target.value)}
      />
      <p className="text-sm text-muted-foreground">
        Your API key is stored locally in your browser
      </p>
    </div>
  );
};