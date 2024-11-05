import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useApiKeys } from "@/hooks/useApiKeys";

export const FineTuningForm = () => {
  const [modelName, setModelName] = useState("");
  const [datasetType, setDatasetType] = useState("");
  const [taskType, setTaskType] = useState("");
  const [hyperparameters, setHyperparameters] = useState({
    learningRate: "0.0001",
    batchSize: "32",
    epochs: "10"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const session = useSession();
  const { getApiKey } = useApiKeys();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("Please login to use this feature");
      return;
    }

    const openaiKey = getApiKey("openai");
    if (!openaiKey) {
      toast.error("Please add your OpenAI API key in Settings");
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Generating fine-tuning script with:", {
        modelName,
        datasetType,
        taskType,
        hyperparameters
      });

      const { data, error } = await supabase.functions.invoke('generate-finetuning-script', {
        body: {
          modelName,
          datasetType,
          taskType,
          hyperparameters,
          apiKey: openaiKey
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }

      if (!data || !data.script) {
        throw new Error("No script generated");
      }

      const { script } = data;

      // Save the job to the database
      const { error: dbError } = await supabase.from('finetuning_jobs').insert({
        user_id: session.user.id,
        model_name: modelName,
        dataset_type: datasetType,
        task_type: taskType,
        hyperparameters,
        colab_script: script
      });

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      toast.success("Fine-tuning script generated successfully!");
    } catch (error) {
      console.error("Error generating fine-tuning script:", error);
      toast.error("Failed to generate fine-tuning script: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Model Name</Label>
            <Select value={modelName} onValueChange={setModelName}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="llama-2">LLaMA 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Dataset Type</Label>
            <Select value={datasetType} onValueChange={setDatasetType}>
              <SelectTrigger>
                <SelectValue placeholder="Select dataset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="conversation">Conversation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Task Type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classification">Classification</SelectItem>
                <SelectItem value="generation">Generation</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Learning Rate</Label>
            <Input
              type="number"
              step="0.0001"
              value={hyperparameters.learningRate}
              onChange={(e) => setHyperparameters(prev => ({
                ...prev,
                learningRate: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Batch Size</Label>
            <Input
              type="number"
              value={hyperparameters.batchSize}
              onChange={(e) => setHyperparameters(prev => ({
                ...prev,
                batchSize: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Epochs</Label>
            <Input
              type="number"
              value={hyperparameters.epochs}
              onChange={(e) => setHyperparameters(prev => ({
                ...prev,
                epochs: e.target.value
              }))}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isGenerating || !modelName || !datasetType || !taskType}
          className="w-full"
        >
          {isGenerating ? "Generating Script..." : "Generate Fine-tuning Script"}
        </Button>
      </form>
    </Card>
  );
};