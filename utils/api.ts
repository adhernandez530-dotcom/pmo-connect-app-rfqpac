
import Constants from 'expo-constants';

export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

console.log('API: Backend URL configured as:', BACKEND_URL);

/**
 * Helper function to make API calls with proper error handling
 */
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`API: Making ${options?.method || 'GET'} request to ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      console.error(`API: Request failed with status ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`API: Request successful, received data:`, data);
    return data;
  } catch (error) {
    console.error(`API: Error making request to ${url}:`, error);
    throw error;
  }
}
