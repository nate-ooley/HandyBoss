import { GOOGLE_MAPS_API_KEY } from '@/lib/constants';

/**
 * Status of the Google Maps API loading process
 */
export enum GoogleMapsStatus {
  NOT_STARTED = 'NOT_STARTED',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  FAILED = 'FAILED'
}

/**
 * Debug information about Google Maps loading
 */
export interface GoogleMapsDebugInfo {
  status: GoogleMapsStatus;
  apiKey: string; 
  loadTime?: number;
  errorMessage?: string;
  scriptElement?: HTMLScriptElement | null;
  attempts: number;
}

// Initialize with default state
let status: GoogleMapsStatus = GoogleMapsStatus.NOT_STARTED;
let debugInfo: GoogleMapsDebugInfo = {
  status: GoogleMapsStatus.NOT_STARTED,
  apiKey: GOOGLE_MAPS_API_KEY ? 'Present (masked)' : 'Not found',
  attempts: 0
};

/**
 * Get the current status of Google Maps API
 */
export const getGoogleMapsStatus = (): GoogleMapsStatus => status;

/**
 * Get detailed debug information about Google Maps loading
 */
export const getGoogleMapsDebugInfo = (): GoogleMapsDebugInfo => ({ ...debugInfo });

/**
 * Check if the Google Maps API is loaded
 */
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
    !!window.google && 
    !!window.google.maps;
};

/**
 * Load the Google Maps API
 * @param apiKey - Optional API key to use instead of the one from constants
 * @param libraries - Optional array of libraries to load
 * @returns Promise that resolves when the API is loaded or rejects on error
 */
export const loadGoogleMapsApi = (
  apiKey: string = GOOGLE_MAPS_API_KEY,
  libraries: string[] = ['places']
): Promise<void> => {
  // Return immediately if already loaded
  if (isGoogleMapsLoaded()) {
    status = GoogleMapsStatus.LOADED;
    debugInfo = {
      ...debugInfo,
      status: GoogleMapsStatus.LOADED,
      attempts: debugInfo.attempts + 1
    };
    return Promise.resolve();
  }

  // Return immediately if already loading
  if (status === GoogleMapsStatus.LOADING) {
    debugInfo.attempts += 1;
    return new Promise((resolve, reject) => {
      // Set up event listeners for load or error
      window.addEventListener('google-maps-loaded', () => resolve(), { once: true });
      window.addEventListener('google-maps-error', (event: any) => {
        reject(event.detail?.error || new Error('Failed to load Google Maps API'));
      }, { once: true });
    });
  }

  // Start loading
  status = GoogleMapsStatus.LOADING;
  debugInfo = {
    ...debugInfo,
    status: GoogleMapsStatus.LOADING,
    attempts: debugInfo.attempts + 1
  };
  
  return new Promise((resolve, reject) => {
    try {
      // Create script element
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}`;
      script.async = true;
      script.defer = true;
      
      // Record start time for performance measurement
      const startTime = performance.now();
      
      // Set up load handler
      script.onload = () => {
        if (isGoogleMapsLoaded()) {
          // Calculate load time
          const loadTime = performance.now() - startTime;
          
          // Update status
          status = GoogleMapsStatus.LOADED;
          debugInfo = {
            ...debugInfo,
            status: GoogleMapsStatus.LOADED,
            loadTime,
            scriptElement: script
          };
          
          // Dispatch custom event for other components to listen to
          window.dispatchEvent(new CustomEvent('google-maps-loaded'));
          
          resolve();
        } else {
          // This shouldn't happen, but just in case
          const error = new Error('Script loaded but Google Maps API not available');
          debugInfo = {
            ...debugInfo,
            status: GoogleMapsStatus.FAILED,
            errorMessage: error.message
          };
          
          window.dispatchEvent(new CustomEvent('google-maps-error', {
            detail: { error }
          }));
          
          reject(error);
        }
      };
      
      // Set up error handler
      script.onerror = () => {
        const error = new Error('Failed to load Google Maps script');
        status = GoogleMapsStatus.FAILED;
        debugInfo = {
          ...debugInfo,
          status: GoogleMapsStatus.FAILED,
          errorMessage: error.message,
          scriptElement: script
        };
        
        window.dispatchEvent(new CustomEvent('google-maps-error', {
          detail: { error }
        }));
        
        reject(error);
      };
      
      // Add to document
      document.head.appendChild(script);
      
      // Set timeout to detect if loading takes too long
      setTimeout(() => {
        if (status !== GoogleMapsStatus.LOADED) {
          const error = new Error('Timeout loading Google Maps API');
          debugInfo.errorMessage = error.message;
          
          window.dispatchEvent(new CustomEvent('google-maps-error', {
            detail: { error }
          }));
          
          // Don't update status or reject promise - it might still load
        }
      }, 10000); // 10 second timeout
    } catch (error) {
      status = GoogleMapsStatus.FAILED;
      debugInfo = {
        ...debugInfo,
        status: GoogleMapsStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      
      reject(error);
    }
  });
};

/**
 * Initialize Google Maps verification
 * This can be called early in the application to start loading the API
 * and set up event listeners
 */
export const initGoogleMapsVerification = (): void => {
  // If already initialized or running in SSR, do nothing
  if (status !== GoogleMapsStatus.NOT_STARTED || typeof window === 'undefined') {
    return;
  }
  
  // If Google Maps is already loaded, update status
  if (isGoogleMapsLoaded()) {
    status = GoogleMapsStatus.LOADED;
    debugInfo = {
      ...debugInfo,
      status: GoogleMapsStatus.LOADED
    };
    
    // Dispatch event for consistency
    window.dispatchEvent(new CustomEvent('google-maps-loaded'));
    return;
  }
  
  // Check if the script is already in the document
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  
  if (existingScript) {
    // Script exists but API not loaded yet
    status = GoogleMapsStatus.LOADING;
    debugInfo = {
      ...debugInfo,
      status: GoogleMapsStatus.LOADING,
      scriptElement: existingScript as HTMLScriptElement
    };
    
    // Set up mutation observer to detect when API is loaded
    const observer = new MutationObserver((mutations) => {
      if (isGoogleMapsLoaded()) {
        status = GoogleMapsStatus.LOADED;
        debugInfo = {
          ...debugInfo,
          status: GoogleMapsStatus.LOADED
        };
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('google-maps-loaded'));
        
        // Disconnect observer
        observer.disconnect();
      }
    });
    
    // Observe document for changes
    observer.observe(document, {
      childList: true,
      subtree: true
    });
    
    // Set a timeout to stop observing if it takes too long
    setTimeout(() => {
      observer.disconnect();
      
      // If still not loaded, load it manually
      if (!isGoogleMapsLoaded()) {
        loadGoogleMapsApi().catch(console.error);
      }
    }, 5000);
  } else {
    // No script found, load it manually
    loadGoogleMapsApi().catch(console.error);
  }
};

// Initialize on import if running in browser
if (typeof window !== 'undefined') {
  // Delay initialization to ensure document is ready
  setTimeout(initGoogleMapsVerification, 0);
} 