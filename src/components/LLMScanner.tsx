import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LLMScanner = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string>("");

  const providers = {
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

  const handleScan = async () => {
    if (!selectedProvider) {
      toast.error("Please select a provider");
      return;
    }

    if (selectedProvider === "custom" && !customEndpoint) {
      toast.error("Please enter a custom endpoint URL");
      return;
    }

    if (!prompt) {
      toast.error("Please enter a prompt");
      return;
    }

    setScanning(true);
    try {
      if (selectedProvider === "openai") {
        const { data, error } = await supabase.functions.invoke('llm-scan', {
          body: { 
            prompt,
            model: selectedModel || "gpt-4o-mini"
          }
        });

        if (error) throw error;
        setResult(data.result);
        toast.success("LLM scan completed");
      } else {
        toast.info("Support for this provider will be implemented soon");
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
          <div className="space-y-2">
            <Label>Select Provider</Label>
            <Select
              value={selectedProvider}
              onValueChange={(value) => {
                setSelectedProvider(value);
                setSelectedModel("");
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
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
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

          {selectedProvider === "custom" && (
            <div className="space-y-2">
              <Label>Custom Endpoint URL</Label>
              <Input
                type="url"
                placeholder="https://your-custom-endpoint.com"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              placeholder="Enter your prompt for scanning"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleScan}
            disabled={scanning}
            className="w-full"
          >
            {scanning ? "Scanning..." : "Start LLM Scan"}
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