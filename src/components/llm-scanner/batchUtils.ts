import { v4 as uuidv4 } from 'uuid';
import { handleSingleScan } from './scanUtils';

export const handleBatchScan = async (
  prompts: string[],
  selectedProvider: string,
  apiKey: string,
  customEndpoint: string,
  curlCommand: string,
  promptPlaceholder: string,
  customHeaders: string,
  selectedModel: string,
  userId: string,
  setCurrentPromptIndex: (index: number) => void
) => {
  const batchId = uuidv4();
  
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
      userId
    );
  }

  return { batchId };
};