import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { refreshToken } from './api';

// Flag to prevent multiple refresh token calls
let isRefreshing = false;
// Store pending requests that are waiting for token refresh
let pendingRequests: Array<() => void> = [];

// This function processes all pending requests
const processQueue = (error: Error | null = null) => {
  pendingRequests.forEach(callback => callback());
  pendingRequests = [];
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Enhanced API request with token refresh logic
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retried: boolean = false
): Promise<Response> {
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  
  // Prepare headers
  const headers: HeadersInit = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    // If token exists in localStorage, send it as a fallback
    // Primary authentication will use the HTTP-only cookie
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  try {
    console.log(`Making ${method} request to ${url} with credentials`);
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Always include credentials (cookies)
    });
    
    // If the request is unauthorized but we haven't retried yet
    if (res.status === 401 && !retried) {
      // Only one request should refresh the token
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          // Try to refresh the token
          await refreshToken();
          
          // Process any pending requests
          processQueue();
        } catch (refreshError) {
          // Token refresh failed, clear pending requests with error
          processQueue(refreshError instanceof Error ? refreshError : new Error('Failed to refresh token'));
          
          // Remove token from localStorage since it's invalid
          localStorage.removeItem('auth_token');
          
          // Rethrow to propagate the error
          throw refreshError;
        } finally {
          isRefreshing = false;
        }
      }
      
      // If we're already refreshing, add this request to the queue
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push(() => {
            // Retry the request with the new token, and mark it as retried
            resolve(apiRequest(method, url, data, true));
          });
        });
      }
      
      // After refresh, retry this request with the new token
      return apiRequest(method, url, data, true);
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // If the error is related to token refresh, propagate it
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Use the enhanced apiRequest with token refresh logic
      const res = await apiRequest("GET", queryKey[0] as string);
      
      // Return successful data
      return await res.json();
    } catch (error) {
      // If the endpoint returns 401 and we're configured to return null, do so
      if (error instanceof Error && 
          error.message.startsWith('401:') && 
          unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      // Otherwise propagate the error
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute stale time for better performance
      gcTime: 5 * 60 * 1000, // 5 minutes cache time (formerly cacheTime)
      retry: false,
      networkMode: 'always', // Always try network requests even if offline (helps with concurrency)
      
      // Optimization for concurrent API calls
      refetchOnMount: 'always', // Always refetch on mount, including background mounts
    },
    mutations: {
      retry: false,
      networkMode: 'always', // Always try network requests
    },
  },
});
