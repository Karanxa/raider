import { useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { handleSingleScan } from "./scanUtils";

export const useScanLogic = (session: Session | null) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [batchId, setBatchId] = useState<string | null>(null);

  const processPrompts = async (
    prompts: string[],
    singlePrompt: string,
    selectedProvider: string,
    apiKey: string,
    customEndpoint: string,
    curlCommand: string,
    promptPlaceholder: string,
    customHeaders: string,
    selectedModel: string,
    qps: number,
    label?: string
  ) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to perform scans");
      return;
    }

    if (!selectedProvider) {
      toast.error("Please select a provider");
      return;
    }

    if (prompts.length === 0 && !singlePrompt) {
      toast.error("Please enter a prompt or upload a CSV file");
      return;
    }

    setScanning(true);
    setResult(null);
    setCurrentPromptIndex(0);

    try {
      if (prompts.length > 0) {
        const newBatchId = uuidv4();
        setBatchId(newBatchId);
        
        for (let i = 0; i < prompts.length; i++) {
          setCurrentPromptIndex(i);
          
          const result = await handleSingleScan(
            prompts[i],
            selectedProvider,
            apiKey,
            customEndpoint,
            curlCommand,
            promptPlaceholder,
            customHeaders,
            selectedModel,
            session.user.id,
            'batch',
            newBatchId,
            label
          );

          if (i < prompts.length - 1) {
            // Wait for the specified QPS delay
            await new Promise(resolve => setTimeout(resolve, 1000 / qps));
          }
        }
        
        toast.success("Batch scan completed successfully");
      } else {
        const result = await handleSingleScan(
          singlePrompt,
          selectedProvider,
          apiKey,
          customEndpoint,
          curlCommand,
          promptPlaceholder,
          customHeaders,
          selectedModel,
          session.user.id,
          'manual',
          null,
          label
        );
        setResult(result);
        toast.success("Scan completed successfully");
      }
    } catch (error) {
      console.error("Scan error:", error);
      toast.error(error.message || "An error occurred during the scan");
    } finally {
      setScanning(false);
    }
  };

  return {
    scanning,
    result,
    currentPromptIndex,
    processPrompts,
    batchId,
  };
};