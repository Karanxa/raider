import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useApiKeys } from "@/hooks/useApiKeys";

export const ApiKeySettings = () => {
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [huggingfaceKey, setHuggingfaceKey] = useState("");
  const { saveApiKey, getApiKey } = useApiKeys();

  useEffect(() => {
    // Load saved API keys
    setOpenaiKey(getApiKey("openai") || "");
    setGeminiKey(getApiKey("gemini") || "");
    setHuggingfaceKey(getApiKey("huggingface") || "");
  }, []);

  const handleSave = () => {
    try {
      if (openaiKey) saveApiKey("openai", openaiKey);
      if (geminiKey) saveApiKey("gemini", geminiKey);
      if (huggingfaceKey) saveApiKey("huggingface", huggingfaceKey);
      toast.success("API keys saved successfully");
    } catch (error) {
      toast.error("Failed to save API keys");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">API Keys</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Configure your API keys for different services. These keys are stored securely in your browser's local storage and are required for various features like fine-tuning and model inference.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>OpenAI API Key</Label>
          <Input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
          />
          <p className="text-sm text-muted-foreground">
            Required for model fine-tuning and GPT-based features
          </p>
        </div>

        <div className="space-y-2">
          <Label>Google Gemini API Key</Label>
          <Input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
          />
        </div>

        <div className="space-y-2">
          <Label>HuggingFace API Key</Label>
          <Input
            type="password"
            value={huggingfaceKey}
            onChange={(e) => setHuggingfaceKey(e.target.value)}
            placeholder="Enter your HuggingFace API key"
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Save API Keys
        </Button>
      </div>
    </div>
  );
};