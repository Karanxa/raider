import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleSingleScan } from "./scanUtils";
import { handleBatchScan } from "./batchUtils";

export const useScanLogic = (session: any) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string>("");
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [batchId, setBatchId] = useState<string | null>(null);

  const processPrompts = async (
    prompts: string[],
    prompt: string,
    selectedProvider: string,
    apiKey: string,
    customEndpoint: string,
    curlCommand: string,
    promptPlaceholder: string,
    customHeaders: string,
    selectedModel: string,
    qps: number = 10
  ) => {
    if (prompts.length === 0 && !prompt) {
      toast.error("Please enter a prompt or upload a CSV file");
      return;
    }

    if (!selectedProvider) {
      toast.error("Please select a provider");
      return;
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to run scans");
      return;
    }

    setScanning(true);
    setBatchId(null);
    
    try {
      if (prompts.length > 0) {
        const { batchId: newBatchId } = await handleBatchScan(
          prompts,
          selectedProvider,
          apiKey,
          customEndpoint,
          curlCommand,
          promptPlaceholder,
          customHeaders,
          selectedModel,
          session.user.id,
          setCurrentPromptIndex,
          qps
        );
        setBatchId(newBatchId);
        toast.success("Batch processing completed");
      } else {
        const result = await handleSingleScan(
          prompt,
          selectedProvider,
          apiKey,
          customEndpoint,
          curlCommand,
          promptPlaceholder,
          customHeaders,
          selectedModel,
          session.user.id
        );
        setResult(result);
        toast.success("Scan completed");
      }
    } catch (error) {
      console.error('LLM scan error:', error);
      toast.error(`Error during scan: ${error.message}`);
    } finally {
      setScanning(false);
      setCurrentPromptIndex(0);
    }
  };

  return {
    scanning,
    result,
    currentPromptIndex,
    processPrompts,
    batchId
  };
};