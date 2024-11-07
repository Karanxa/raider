import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface SecurityTestFormProps {
  onSubmit: (data: {
    modelEndpoint: string;
    apiKey: string;
    testType: string;
    sampleInput: string;
  }) => void;
  isLoading: boolean;
}

export const SecurityTestForm = ({ onSubmit, isLoading }: SecurityTestFormProps) => {
  const [modelEndpoint, setModelEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testType, setTestType] = useState("");
  const [sampleInput, setSampleInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      modelEndpoint,
      apiKey,
      testType,
      sampleInput
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Model Endpoint URL</Label>
        <Input
          type="url"
          value={modelEndpoint}
          onChange={(e) => setModelEndpoint(e.target.value)}
          placeholder="https://api.example.com/v1/predict"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>API Key</Label>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Test Type</Label>
        <Select value={testType} onValueChange={setTestType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select test type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prompt-injection">Prompt Injection</SelectItem>
            <SelectItem value="model-inversion">Model Inversion</SelectItem>
            <SelectItem value="adversarial">Adversarial Attacks</SelectItem>
            <SelectItem value="data-extraction">Data Extraction</SelectItem>
            <SelectItem value="model-poisoning">Model Poisoning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sample Input</Label>
        <Textarea
          value={sampleInput}
          onChange={(e) => setSampleInput(e.target.value)}
          placeholder="Enter a sample input to test with"
          className="min-h-[100px]"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Security Tests...
          </>
        ) : (
          "Start Security Test"
        )}
      </Button>
    </form>
  );
};