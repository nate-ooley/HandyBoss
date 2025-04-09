import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get the API base URL from environment or use the current host
const getApiBaseUrl = () => {
  // If explicitly set in environment, use that
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Auto-detect from browser URL if we're in the browser
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    // Use the same hostname but change the port if needed
    // Check if we're running on port 3000 or 5173 (Vite dev server ports)
    if (url.port === '3000' || url.port === '5173') {
      // The server might be running on 3301, 3302, or 3303 depending on port conflicts
      const baseHost = `${url.protocol}//${url.hostname}`;
      
      // We'll use localStorage to remember which port worked last
      const lastWorking = localStorage.getItem('lastWorkingServerPort');
      if (lastWorking) {
        console.log(`Using remembered server port: ${lastWorking}`);
        return `${baseHost}:${lastWorking}`;
      }
      
      // Default to 3301, but client code will try alternatives if this fails
      return `${baseHost}:3301`;
    }
    // Otherwise use whatever port we're already on
    return `${url.protocol}//${url.hostname}:${url.port}`;
  }
  
  // Fall back to localhost:3301 if all else fails
  return 'http://localhost:3301';
};

// Function to make API requests with proper headers
export const apiRequest = async (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', endpoint: string, body?: any) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  // Get the base URL from our helper function
  let baseUrl = getApiBaseUrl();
  
  // Define alternative ports to try
  const portOptions = [3301, 3302, 3303];
  // Extract the current port from the baseUrl
  const currentPort = parseInt(baseUrl.split(':').pop() || '3301');
  // Start with the current port, then try all others in order
  const portsToTry = [
    currentPort,
    ...portOptions.filter(port => port !== currentPort)
  ];
  
  let lastError: Error | null = null;
  
  // Try each port in sequence until one works
  for (const port of portsToTry) {
    try {
      // Create URL with the current port
      const urlBase = baseUrl.replace(/:\d+$/, `:${port}`);
      const url = `${urlBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      
      console.log(`Making API request to ${url}`);
      const response = await fetch(url, options);
      
      // If we get a response (not a connection error), store this port as the working one
      localStorage.setItem('lastWorkingServerPort', port.toString());
      
      // For GET requests, treat 404 as an error that might be fixed by trying another port
      if (method === 'GET' && response.status === 404) {
        console.log(`Got 404 from port ${port}, will try another port if available`);
        lastError = new Error(`404 Not Found on port ${port}`);
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`API request error on port ${port}:`, error);
      lastError = error as Error;
      // Continue to try the next port
    }
  }
  
  // If we've tried all ports and none worked, throw the last error
  throw lastError || new Error('Failed to connect to any server port');
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
