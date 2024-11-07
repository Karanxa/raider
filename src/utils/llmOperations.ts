import { supabase } from "@/integrations/supabase/client";

export async function performModelSecurityTest(params: {
  userId: string;
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

export async function executeScheduledScan(params: {
  userId: string;
  prompt: string;
  provider: string;
  model?: string;
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