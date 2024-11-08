import { supabase } from "@/integrations/supabase/client";

export const performLLMScan = async (
  prompt: string,
  provider: string,
  model: string | null,
  userId: string,
  customEndpoint?: string,
  curlCommand?: string,
  customHeaders?: string,
  apiKey?: string
) => {
  const { data, error } = await supabase.functions.invoke('ai-operations', {
    body: {
      operation: 'llm-scan',
      prompt,
      provider,
      model,
      userId,
      customEndpoint,
      curlCommand,
      customHeaders,
      apiKey
    }
  });

  if (error) throw error;
  return data;
};

export const performBatchScan = async (
  prompts: string[],
  provider: string,
  model: string | null,
  userId: string,
  batchName: string,
  customEndpoint?: string,
  curlCommand?: string,
  customHeaders?: string,
  apiKey?: string
) => {
  const { data, error } = await supabase.functions.invoke('ai-operations', {
    body: {
      operation: 'batch-llm-scan',
      prompts,
      provider,
      model,
      userId,
      batchName,
      customEndpoint,
      curlCommand,
      customHeaders,
      apiKey
    }
  });

  if (error) throw error;
  return data;
};