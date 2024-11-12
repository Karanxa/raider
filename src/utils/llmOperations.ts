import { supabase } from "@/integrations/supabase/client";

export async function performSecurityTest(params: {
  modelEndpoint: string;
  testType: string;
}) {
  const { data, error } = await supabase.functions.invoke('llm-operations', {
    body: { 
      operation: 'security-test',
      ...params
    }
  });

  if (error) throw error;
  return data;
}

export async function scheduleScans(params: {
  prompt: string;
  provider: string;
  model?: string;
  schedule: string;
  isRecurring: boolean;
  customEndpoint?: string;
  customHeaders?: string;
}) {
  const { data, error } = await supabase.functions.invoke('llm-operations', {
    body: { 
      operation: 'scheduled-scan',
      ...params
    }
  });

  if (error) throw error;
  return data;
}