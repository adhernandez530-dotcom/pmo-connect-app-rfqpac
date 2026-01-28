
import Constants from "expo-constants";
import { authClient } from "@/lib/auth";

/**
 * Backend URL is configured in app.json under expo.extra.backendUrl
 * It is set automatically when the backend is deployed
 */
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "";

/**
 * Check if backend is properly configured
 */
export const isBackendConfigured = (): boolean => {
  return !!BACKEND_URL && BACKEND_URL.length > 0;
};

/**
 * Get session token from Better Auth
 * This uses the auth client's session management
 *
 * @returns Session token or null if not found
 */
export const getSessionToken = async (): Promise<string | null> => {
  try {
    const session = await authClient.getSession();
    return session?.data?.session?.token || null;
  } catch (error) {
    console.error("[API] Error retrieving session token:", error);
    return null;
  }
};

/**
 * Generic API call helper with error handling
 *
 * @param endpoint - API endpoint path (e.g., '/users', '/auth/login')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed JSON response
 * @throws Error if backend is not configured or request fails
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  if (!isBackendConfigured()) {
    throw new Error("Backend URL not configured. Please rebuild the app.");
  }

  const url = `${BACKEND_URL}${endpoint}`;
  console.log("[API] Calling:", url, options?.method || "GET");

  try {
    // Don't override headers if they're already set (important for FormData)
    const headers = options?.headers || {};
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Important: Include cookies for Better Auth
    });

    console.log("[API] Response status:", response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error("[API] Error response:", response.status, text);
      
      // Parse error message from response
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = JSON.parse(text);
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If parsing fails, use the text as is
        if (text) {
          errorMessage = text;
        }
      }
      
      throw new Error(`API error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    console.log("[API] Success:", data);
    return data;
  } catch (error: any) {
    console.error("[API] Request failed:", error);
    
    // Re-throw with better error message
    if (error.message) {
      throw error;
    } else {
      throw new Error("Network request failed. Please check your connection.");
    }
  }
};

/**
 * GET request helper
 */
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: "GET" });
};

/**
 * POST request helper
 */
export const apiPost = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/**
 * PUT request helper
 */
export const apiPut = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/**
 * PATCH request helper
 */
export const apiPatch = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request helper
 * Always sends a body to avoid FST_ERR_CTP_EMPTY_JSON_BODY errors
 */
export const apiDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated API call helper
 * Uses Better Auth session cookies for authentication
 *
 * @param endpoint - API endpoint path
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed JSON response
 * @throws Error if session not found or request fails
 */
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  // Check for session
  console.log("[API] Checking for authentication session");
  const session = await authClient.getSession();

  if (!session?.data?.session) {
    console.error("[API] No authentication session found");
    console.error("[API] Session data:", JSON.stringify(session, null, 2));
    throw new Error("Authentication session not found. Please sign in.");
  }

  console.log("[API] Session found for user:", session.data.user?.email);
  console.log("[API] Session token:", session.data.session.token ? "present" : "missing");

  // Check if body is FormData to avoid setting Content-Type
  const isFormData = options?.body instanceof FormData;

  return apiCall<T>(endpoint, {
    ...options,
    headers: {
      // Don't override Content-Type if it's FormData or already set
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
    credentials: "include", // Include cookies for Better Auth
  });
};

/**
 * Authenticated GET request
 */
export const authenticatedGet = async <T = any>(endpoint: string): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "GET" });
};

/**
 * Authenticated POST request
 * Supports both JSON and FormData
 */
export const authenticatedPost = async <T = any>(
  endpoint: string,
  data: any,
  options?: RequestInit
): Promise<T> => {
  // Check if data is FormData
  const isFormData = data instanceof FormData;
  
  return authenticatedApiCall<T>(endpoint, {
    method: "POST",
    body: isFormData ? data : JSON.stringify(data),
    ...options,
    headers: {
      // Don't set Content-Type for FormData - browser will set it with boundary
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });
};

/**
 * Authenticated PUT request
 */
export const authenticatedPut = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated PATCH request
 */
export const authenticatedPatch = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated DELETE request
 * Always sends a body to avoid FST_ERR_CTP_EMPTY_JSON_BODY errors
 */
export const authenticatedDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated fetch helper that returns the Response object
 * Useful when you need to check response.ok or handle errors manually
 *
 * @param url - Full URL or endpoint path
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Response object
 * @throws Error if session not found
 */
export const authenticatedFetch = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  console.log("[API] Authenticated fetch - checking session");
  const session = await authClient.getSession();

  if (!session?.data?.session) {
    console.error("[API] No authentication session found for fetch");
    console.error("[API] Session data:", JSON.stringify(session, null, 2));
    throw new Error("Authentication session not found. Please sign in.");
  }

  console.log("[API] Session found for fetch, user:", session.data.user?.email);

  const fullUrl = url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  console.log("[API] Authenticated fetch:", fullUrl, options?.method || "GET");

  return fetch(fullUrl, {
    ...options,
    headers: {
      ...options?.headers,
    },
    credentials: "include", // Include cookies for Better Auth
  });
};
