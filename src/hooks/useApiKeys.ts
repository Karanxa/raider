const API_KEYS_STORAGE_KEY = "app_api_keys";

export const useApiKeys = () => {
  const saveApiKey = (service: string, key: string) => {
    try {
      const existingKeys = JSON.parse(localStorage.getItem(API_KEYS_STORAGE_KEY) || "{}");
      localStorage.setItem(
        API_KEYS_STORAGE_KEY,
        JSON.stringify({
          ...existingKeys,
          [service]: key,
        })
      );
    } catch (error) {
      console.error("Error saving API key:", error);
      throw error;
    }
  };

  const getApiKey = (service: string): string | null => {
    try {
      const keys = JSON.parse(localStorage.getItem(API_KEYS_STORAGE_KEY) || "{}");
      return keys[service] || null;
    } catch (error) {
      console.error("Error getting API key:", error);
      return null;
    }
  };

  return {
    saveApiKey,
    getApiKey,
  };
};