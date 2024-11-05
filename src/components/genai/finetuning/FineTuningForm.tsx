import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useApiKeys } from "@/hooks/useApiKeys";

export const FineTuningForm = () => {
  const [modelName, setModelName] = useState("");
  const [datasetType, setDatasetType] = useState("");
  const [taskType, setTaskType] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [trainingExamples, setTrainingExamples] = useState("");
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

    if (!trainingExamples.trim()) {
      toast.error("Please provide some training examples");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-finetuning-script', {
        body: {
          modelName,
          datasetType,
          taskType,
          datasetDescription,
          trainingExamples,
          hyperparameters,
          apiKey: openaiKey
        }
      });

      if (error) throw error;
      if (!data?.script) throw new Error("No script generated");

      const { script } = data;

      const { error: dbError } = await supabase.from('finetuning_jobs').insert({
        user_id: session.user.id,
        model_name: modelName,
        dataset_type: datasetType,
        task_type: taskType,
        hyperparameters,
        colab_script: script,
        training_config: {
          dataset_description: datasetDescription,
          examples_count: trainingExamples.split('\n').length
        }
      });

      if (dbError) throw dbError;

      toast.success("Fine-tuning script generated successfully!");
      setDatasetDescription("");
      setTrainingExamples("");
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
            <Label>Base Model</Label>
            <Select value={modelName} onValueChange={setModelName}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="llama-2">LLaMA 2</SelectItem>
                <SelectItem value="mistral">Mistral</SelectItem>
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
            <Label>Dataset Description</Label>
            <Textarea 
              placeholder="Describe your dataset and what you want the model to learn..."
              value={datasetDescription}
              onChange={(e) => setDatasetDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Training Examples</Label>
            <Textarea 
              placeholder="Enter your training examples, one per line..."
              value={trainingExamples}
              onChange={(e) => setTrainingExamples(e.target.value)}
              className="min-h-[200px] font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Examples count: {trainingExamples.split('\n').filter(line => line.trim()).length}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        <Button 
          type="submit" 
          disabled={isGenerating || !modelName || !datasetType || !taskType || !trainingExamples.trim()}
          className="w-full"
        >
          {isGenerating ? "Generating Script..." : "Generate Fine-tuning Script"}
        </Button>
      </form>
    </Card>
  );
};