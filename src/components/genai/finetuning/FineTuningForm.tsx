import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const MODEL_OPTIONS = [
  { value: "llama2-7b", label: "LLaMA 2 7B" },
  { value: "mistral-7b", label: "Mistral 7B" },
  { value: "phi2", label: "Microsoft Phi-2" },
  { value: "custom", label: "Custom Model" }
];

const TASK_TYPES = [
  { value: "text_classification", label: "Text Classification" },
  { value: "token_classification", label: "Token Classification" },
  { value: "question_answering", label: "Question Answering" },
  { value: "summarization", label: "Summarization" },
  { value: "text_generation", label: "Text Generation" }
];

const DATASET_TYPES = [
  { value: "csv", label: "CSV Dataset" },
  { value: "jsonl", label: "JSONL Dataset" },
  { value: "huggingface", label: "HuggingFace Dataset" },
  { value: "custom", label: "Custom Dataset" }
];

export const FineTuningForm = () => {
  const session = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("");
  const [taskType, setTaskType] = useState("");
  const [datasetType, setDatasetType] = useState("");
  const [datasetPath, setDatasetPath] = useState("");
  const [customConfig, setCustomConfig] = useState("");

  const generateScript = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/generate-finetuning-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          taskType,
          datasetType,
          datasetPath,
          customConfig: customConfig ? JSON.parse(customConfig) : {}
        })
      });

      if (!response.ok) throw new Error("Failed to generate script");
      const { script } = await response.json();

      // Save to Supabase
      const { error } = await supabase.from("finetuning_jobs").insert({
        user_id: session?.user?.id,
        model_name: model,
        dataset_type: datasetType,
        task_type: taskType,
        training_config: customConfig ? JSON.parse(customConfig) : {},
        colab_script: script
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fine-tuning script generated successfully!",
      });
    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate fine-tuning script",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Select Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a model" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Task Type</Label>
          <Select value={taskType} onValueChange={setTaskType}>
            <SelectTrigger>
              <SelectValue placeholder="Select task type" />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dataset Type</Label>
          <Select value={datasetType} onValueChange={setDatasetType}>
            <SelectTrigger>
              <SelectValue placeholder="Select dataset type" />
            </SelectTrigger>
            <SelectContent>
              {DATASET_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dataset Path/URL</Label>
          <Input
            placeholder="Enter dataset path or URL"
            value={datasetPath}
            onChange={(e) => setDatasetPath(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Custom Configuration (JSON)</Label>
          <Textarea
            placeholder="Enter custom configuration in JSON format"
            value={customConfig}
            onChange={(e) => setCustomConfig(e.target.value)}
            className="h-32"
          />
        </div>

        <Button 
          onClick={generateScript} 
          disabled={loading || !model || !taskType || !datasetType}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Fine-tuning Script"}
        </Button>
      </div>
    </Card>
  );
};