import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, HelpCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ATTACK_DESCRIPTIONS = {
  "model-extraction": "Attempts to steal model parameters and architecture through repeated queries",
  "membership-inference": "Tests if it's possible to determine if specific data was used in training",
  "adversarial-examples": "Generates inputs designed to fool the model's predictions",
  "model-inversion": "Attempts to reconstruct training data from model outputs",
  "poisoning": "Tests model's resilience against contaminated training data",
  "evasion": "Attempts to bypass model's security controls and filters",
  "backdoor": "Checks for hidden behaviors triggered by specific inputs",
  "model-stealing": "Tries to replicate model functionality through black-box access",
  "transferability": "Tests if attacks successful on one model work on another"
} as const;

const INPUT_EXAMPLES = {
  api: {
    endpoint: "https://api.openai.com/v1/completions",
    description: "The full URL of your model's API endpoint"
  },
  local: {
    path: "/path/to/model/directory or model.safetensors",
    description: "Local filesystem path to your model files"
  },
  sampleInput: {
    text: 'What is the capital of France?',
    description: "A representative example of inputs your model typically processes"
  }
};

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setModelWeights(e.target.files[0]);
    }
  };

  const LabelWithTooltip = ({ label, description }: { label: string; description: string }) => (
    <div className="flex items-center gap-2">
      <Label>{label}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <LabelWithTooltip 
          label="Model Access Method" 
          description="How do you want to access the model for testing?"
        />
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
            <LabelWithTooltip 
              label="Model Endpoint URL" 
              description={INPUT_EXAMPLES.api.description}
            />
            <Input
              type="url"
              value={modelEndpoint}
              onChange={(e) => setModelEndpoint(e.target.value)}
              placeholder={INPUT_EXAMPLES.api.endpoint}
              required={accessMethod === "api"}
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip 
              label="API Key" 
              description="Your authentication key for accessing the model API"
            />
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
          <LabelWithTooltip 
            label="Local Model Path" 
            description={INPUT_EXAMPLES.local.description}
          />
          <Input
            type="text"
            value={localModelPath}
            onChange={(e) => setLocalModelPath(e.target.value)}
            placeholder={INPUT_EXAMPLES.local.path}
            required={accessMethod === "local"}
          />
        </div>
      )}

      {accessMethod === "weights" && (
        <div className="space-y-2">
          <LabelWithTooltip 
            label="Model Weights File" 
            description="Upload your model weights file (supported formats: .safetensors, .bin, .pt, .pth)"
          />
          <Input
            type="file"
            onChange={handleFileChange}
            required={accessMethod === "weights"}
            accept=".safetensors,.bin,.pt,.pth"
          />
        </div>
      )}

      {accessMethod === "architecture" && (
        <div className="space-y-2">
          <LabelWithTooltip 
            label="Model Architecture (JSON)" 
            description="Paste your model's architecture configuration in JSON format"
          />
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
        <LabelWithTooltip 
          label="Test Type" 
          description="Select the type of security test to perform"
        />
        <Select value={testType} onValueChange={setTestType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select test type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ATTACK_DESCRIPTIONS).map(([key, description]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span className="font-medium">{key}</span>
                  <span className="text-sm text-muted-foreground">{description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          label="Sample Input" 
          description="Provide a typical input that your model processes"
        />
        <Textarea
          value={sampleInput}
          onChange={(e) => setSampleInput(e.target.value)}
          placeholder={INPUT_EXAMPLES.sampleInput.text}
          className="min-h-[100px]"
          required
        />
        <p className="text-sm text-muted-foreground">
          This will be used to test the model's behavior and identify potential vulnerabilities.
        </p>
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