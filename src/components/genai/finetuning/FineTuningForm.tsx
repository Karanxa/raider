import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useApiKeys } from "@/hooks/useApiKeys";
import { ModelSelect } from "./ModelSelect";
import { DatasetInput } from "./DatasetInput";
import { HyperParameters } from "./HyperParameters";

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
        <ModelSelect
          modelName={modelName}
          setModelName={setModelName}
          datasetType={datasetType}
          setDatasetType={setDatasetType}
          taskType={taskType}
          setTaskType={setTaskType}
        />

        <DatasetInput
          datasetDescription={datasetDescription}
          setDatasetDescription={setDatasetDescription}
          trainingExamples={trainingExamples}
          setTrainingExamples={setTrainingExamples}
        />

        <HyperParameters
          hyperparameters={hyperparameters}
          setHyperparameters={setHyperparameters}
        />

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