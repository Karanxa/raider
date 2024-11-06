export const MAX_RETRIES = 5;
export const INITIAL_RETRY_DELAY = 1000;
export const MAX_RETRY_DELAY = 60000;

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryOperation<T>(
  operation: () => Promise<T>, 
  retries = MAX_RETRIES,
  isRateLimitError: (error: any) => boolean = (error) => error.message?.includes('rate limit')
): Promise<T> {
  let lastError: Error | null = null;
  let currentDelay = INITIAL_RETRY_DELAY;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (error.status === 401) {
        throw new Error('Invalid GitHub credentials. Please check your token.');
      }
      
      if (isRateLimitError(error) && attempt < retries) {
        console.log(`Rate limit hit, switching tokens and retrying. Attempt ${attempt + 1}/${retries}`);
        await sleep(currentDelay);
        currentDelay = Math.min(currentDelay * 2, MAX_RETRY_DELAY);
        continue;
      }
      
      throw lastError;
    }
  }
  throw lastError;
}