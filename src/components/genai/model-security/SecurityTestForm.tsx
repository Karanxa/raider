import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SecurityTestFormProps {
  onSubmit: (data: {
    modelEndpoint: string;
    apiKey: string;
    testType: string;
    sampleInput: string;
    accessMethod: string;
    modelArchitecture?: string;
    modelWeights?: File;
    localModelPath?: string;
  }) => void;
  isLoading: boolean;
}

export const SecurityTestForm = ({ onSubmit, isLoading }: SecurityTestFormProps) => {
  const [modelEndpoint, setModelEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testType, setTestType] = useState("");
  const [sampleInput, setSampleInput] = useState("");
  const [accessMethod, setAccessMethod] = useState("api");
  const [modelArchitecture, setModelArchitecture] = useState("");
  const [modelWeights, setModelWeights] = useState<File | null>(null);
  const [localModelPath, setLocalModelPath] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      modelEndpoint,
      apiKey,
      testType,
      sampleInput,
      accessMethod,
      ...(accessMethod === "architecture" && { modelArchitecture }),
      ...(accessMethod === "weights" && { modelWeights: modelWeights! }),
      ...(accessMethod === "local" && { localModelPath })
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Model Access Method</Label>
        <RadioGroup value={accessMethod} onValueChange={setAccessMethod} className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="api" id="api" />
            <Label htmlFor="api">API Endpoint</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="local" id="local" />
            <Label htmlFor="local">Local Model Path</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="weights" id="weights" />
            <Label htmlFor="weights">Model Weights File</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="architecture" id="architecture" />
            <Label htmlFor="architecture">Model Architecture</Label>
          </div>
        </RadioGroup>
      </div>

      {accessMethod === "api" && (
        <>
          <div className="space-y-2">
            <Label>Model Endpoint URL</Label>
            <Input
              type="url"
              value={modelEndpoint}
              onChange={(e) => setModelEndpoint(e.target.value)}
              placeholder="https://api.example.com/v1/predict"
              required={accessMethod === "api"}
            />
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required={accessMethod === "api"}
            />
          </div>
        </>
      )}

      {accessMethod === "local" && (
        <div className="space-y-2">
          <Label>Local Model Path</Label>
          <Input
            type="text"
            value={localModelPath}
            onChange={(e) => setLocalModelPath(e.target.value)}
            placeholder="/path/to/model"
            required={accessMethod === "local"}
          />
        </div>
      )}

      {accessMethod === "weights" && (
        <div className="space-y-2">
          <Label>Model Weights File</Label>
          <Input
            type="file"
            onChange={(e) => setModelWeights(e.files?.[0] || null)}
            required={accessMethod === "weights"}
          />
        </div>
      )}

      {accessMethod === "architecture" && (
        <div className="space-y-2">
          <Label>Model Architecture (JSON)</Label>
          <Textarea
            value={modelArchitecture}
            onChange={(e) => setModelArchitecture(e.target.value)}
            placeholder='{"layers": [...], "config": {...}}'
            required={accessMethod === "architecture"}
            className="font-mono"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Test Type</Label>
        <Select value={testType} onValueChange={setTestType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select test type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="model-extraction">Model Extraction Attack</SelectItem>
            <SelectItem value="membership-inference">Membership Inference</SelectItem>
            <SelectItem value="adversarial-examples">Adversarial Examples</SelectItem>
            <SelectItem value="model-inversion">Model Inversion</SelectItem>
            <SelectItem value="poisoning">Data Poisoning</SelectItem>
            <SelectItem value="evasion">Evasion Attack</SelectItem>
            <SelectItem value="backdoor">Backdoor Attack</SelectItem>
            <SelectItem value="model-stealing">Model Stealing</SelectItem>
            <SelectItem value="transferability">Transferability Attack</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          {testType === "model-extraction" && "Tests if the model can be extracted through repeated queries"}
          {testType === "membership-inference" && "Tests if it's possible to determine if data was in training set"}
          {testType === "adversarial-examples" && "Tests model robustness against perturbed inputs"}
          {testType === "model-inversion" && "Tests if training data can be reconstructed from the model"}
          {testType === "poisoning" && "Tests resistance to training data manipulation"}
          {testType === "evasion" && "Tests if model classifications can be evaded"}
          {testType === "backdoor" && "Tests for hidden functionalities in the model"}
          {testType === "model-stealing" && "Tests if model functionality can be replicated"}
          {testType === "transferability" && "Tests if attacks transfer between models"}
        </p>
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