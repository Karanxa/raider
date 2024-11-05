import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ModelSelect } from "./ModelSelect";
import { DatasetInput } from "./DatasetInput";
import { HyperParameters } from "./HyperParameters";
import { useApiKeys } from "@/hooks/useApiKeys";
import { ScriptDisplay } from "./ScriptDisplay";

export const FineTuningForm = () => {
  const [selectedModel, setSelectedModel] = useState("");
  const [datasetType, setDatasetType] = useState("");
  const [taskType, setTaskType] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const session = useSession();
  const { getApiKey } = useApiKeys();
  
  const [hyperparameters, setHyperparameters] = useState({
    // Basic parameters
    learningRate: "0.0001",
    batchSize: "32",
    epochs: "10",
    warmupSteps: "500",
    weightDecay: "0.01",
    optimizerType: "adamw",
    schedulerType: "linear",
    gradientClipping: "1.0",
    useEarlyStopping: true,
    validationSplit: "0.2",
    dropoutRate: "0.1",
    seed: "42",
    maxSteps: "1000",
    evaluationStrategy: "steps",
    evaluationSteps: "500",
    loggingSteps: "100",
    saveStrategy: "steps",
    saveSteps: "500",
    
    // Advanced parameters
    finetuningType: "sft",
    
    loraConfig: {
      rank: "8",
      alpha: "16",
      dropout: "0.1",
      targetModules: [],
      bias: "none",
      scalingRank: "4",
      moduleMapping: "",
      fanoutScaling: false,
      useReparameterization: false,
      rankPattern: "8,16,32",
      alphaPattern: "16,32,64",
      taskType: "causal_lm"
    },
    
    qloraConfig: {
      bitsQuant: "4",
      groupSize: "128",
      doubleQuant: true,
      quantizationMethod: "symmetric",
      useNesterov: false,
      usePagedOptim: true,
      useFastTokenizer: true,
      blockSize: "64",
      targetModules: [],
      quantizedDataType: "nf4"
    },
    
    sftConfig: {
      useDeepSpeed: false,
      gradientCheckpointing: true,
      mixedPrecision: "fp16",
      useFlashAttention: true,
      useXformers: false,
      useTritonKernels: false,
      gradientAccumulationSteps: "4",
      maxGradNorm: "1.0",
      optimMemory: true,
      useActivationCheckpointing: false,
      useFsdp: false,
      useParallelTraining: false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Please login to continue");
      return;
    }

    const openaiKey = getApiKey("openai");
    if (!openaiKey) {
      toast.error("Please set your OpenAI API key in Settings first");
      return;
    }

    if (!selectedModel || !datasetType || !taskType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedFile) {
      toast.error("Please upload a dataset file");
      return;
    }

    setIsGenerating(true);
    setGeneratedScript(null);

    try {
      // Read file content as text
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(selectedFile);
      });

      // Take first 5 lines as example data
      const exampleData = fileContent.split('\n').slice(0, 5).join('\n');

      // Generate training script using Edge Function
      const { error: fnError, data } = await supabase.functions.invoke('generate-finetuning-script', {
        body: {
          modelName: selectedModel,
          datasetType,
          taskType,
          datasetDescription: `File type: ${selectedFile.type}, Size: ${selectedFile.size} bytes`,
          trainingExamples: exampleData,
          hyperparameters,
          apiKey: openaiKey
        }
      });

      if (fnError) {
        throw new Error(`Failed to generate script: ${fnError.message}`);
      }

      // Store the generated script
      const { error: dbError } = await supabase
        .from('finetuning_jobs')
        .insert({
          user_id: session.user.id,
          model_name: selectedModel,
          dataset_type: datasetType,
          task_type: taskType,
          hyperparameters,
          colab_script: data.script,
          status: 'generated'
        });

      if (dbError) {
        throw new Error(`Failed to save script: ${dbError.message}`);
      }

      setGeneratedScript(data.script);
      toast.success("Fine-tuning script generated successfully");
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate fine-tuning script');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <ModelSelect
            modelName={selectedModel}
            setModelName={setSelectedModel}
            datasetType={datasetType}
            setDatasetType={setDatasetType}
            taskType={taskType}
            setTaskType={setTaskType}
          />

          <DatasetInput
            onFileSelect={setSelectedFile}
          />

          <HyperParameters
            hyperparameters={hyperparameters}
            setHyperparameters={setHyperparameters}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Script...
              </>
            ) : (
              'Generate Fine-tuning Script'
            )}
          </Button>
        </form>

        <ScriptDisplay script={generatedScript} />
      </CardContent>
    </Card>
  );
};
