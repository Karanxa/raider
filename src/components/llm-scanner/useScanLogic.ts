import { useState } from "react";
import { Session } from "@supabase/supabase-js";
import { handleSingleScan } from "./scanUtils";
import { toast } from "sonner";

export const useScanLogic = (session: Session | null) => {
  const [scanning, setScanning] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

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
    categories: string[],
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

    if (selectedProvider === "openai" && !apiKey) {
      toast.error("Please provide your OpenAI API key in Settings");
      return;
    }

    setScanning(true);
    setCurrentPromptIndex(0);

    try {
      if (prompts.length > 0) {
        for (let i = 0; i < prompts.length; i++) {
          setCurrentPromptIndex(i);
          
          await handleSingleScan(
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
            null,
            label
          );

          if (i < prompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 / qps));
          }
        }
        toast.success("Batch scan completed successfully");
      } else {
        await handleSingleScan(
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
        toast.success("Scan completed successfully");
      }
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Error during scan: " + error.message);
    } finally {
      setScanning(false);
    }
  };

  return {
    scanning,
    currentPromptIndex,
    processPrompts,
  };
};