import React, { useState, useEffect } from 'react';
import { GOOGLE_MAPS_API_KEY, ENABLE_DEBUG } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * MapDebugPanel: A comprehensive troubleshooting tool for Google Maps issues
 * This component can be included anywhere in the application to debug map loading
 * and geocoding issues.
 */
const MapDebugPanel: React.FC = () => {
  const [googleStatus, setGoogleStatus] = useState<string>('Checking...');
  const [scriptStatus, setScriptStatus] = useState<string>('Checking...');
  const [domReady, setDomReady] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [logEntries, setLogEntries] = useState<string[]>([]);

  // Add a log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().substr(11, 8);
    setLogEntries(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  // Check the Google Maps API status
  useEffect(() => {
    addLog('Starting Google Maps diagnostics...');
    
    // Check DOM readiness
    setDomReady(document.readyState === 'complete');
    if (document.readyState !== 'complete') {
      addLog(`DOM not ready yet: ${document.readyState}`);
      
      const handleReadyStateChange = () => {
        setDomReady(document.readyState === 'complete');
        addLog(`DOM ready state changed: ${document.readyState}`);
      };
      
      document.addEventListener('readystatechange', handleReadyStateChange);
      return () => document.removeEventListener('readystatechange', handleReadyStateChange);
    }
    
    // Check Google Maps script status
    const scriptElements = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    
    if (scriptElements.length === 0) {
      setScriptStatus('No Google Maps script tags found in the document.');
      addLog('No Google Maps script tags found');
    } else {
      setScriptStatus(`Found ${scriptElements.length} Google Maps script tags.`);
      
      // Log details about each script
      scriptElements.forEach((script, index) => {
        addLog(`Script ${index + 1}: ${script.getAttribute('src')?.substring(0, 50)}...`);
        // Check if script has loaded
        if (script instanceof HTMLScriptElement) {
          addLog(`Script ${index + 1} loaded: ${!script.async || script.dataset.loaded === 'true'}`);
        }
      });
    }
    
    // Check if Google Maps is available on window
    if (window.google && window.google.maps) {
      setGoogleStatus('Google Maps API is loaded and available.');
      addLog('Google Maps API is loaded and available on window.google.maps');
    } else {
      setGoogleStatus('Google Maps API is not loaded or not available.');
      addLog('Google Maps API not available on window.google.maps');
      
      // Set up listener for Google Maps load event
      const intervalId = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(intervalId);
          setGoogleStatus('Google Maps API has loaded during monitoring.');
          addLog('Google Maps API became available during monitoring');
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, []);

  // Attempt to manually load Google Maps API
  const loadMapsManually = () => {
    try {
      addLog('Attempting to manually load Google Maps API...');
      
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        addLog('Removing existing Google Maps script tag');
        existingScript.remove();
      }
      
      // Create a new script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.loaded = 'false';
      
      script.onload = () => {
        script.dataset.loaded = 'true';
        addLog('Manual script load successful');
        setGoogleStatus('Google Maps API manually loaded successfully.');
        setScriptStatus('Script manually added and loaded.');
        
        // Create a custom event
        const event = new Event('google-maps-loaded');
        window.dispatchEvent(event);
      };
      
      script.onerror = () => {
        addLog('Manual script load failed');
        setGoogleStatus('Failed to manually load Google Maps API.');
        setScriptStatus('Script manually added but failed to load.');
      };
      
      document.head.appendChild(script);
      addLog('Added script to document head');
    } catch (error) {
      addLog(`Error during manual load: ${error}`);
    }
  };
  
  // Clear browser cache for Google Maps
  const clearMapsCache = () => {
    addLog('Attempting to clear Google Maps cache...');
    
    // Remove any existing script tags
    const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    scripts.forEach(script => {
      script.remove();
      addLog('Removed a script tag');
    });
    
    // Clear the Google object if it exists
    if (window.google && window.google.maps) {
      try {
        // @ts-ignore - Delete property from window
        delete window.google.maps;
        if (!window.google.maps) {
          addLog('Successfully removed google.maps object');
        }
      } catch (e) {
        addLog(`Failed to delete google.maps: ${e}`);
      }
    }
    
    // Try to clear localStorage keys related to Google Maps
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('google') || key.includes('map')) {
          localStorage.removeItem(key);
          addLog(`Removed localStorage key: ${key}`);
        }
      });
    } catch (e) {
      addLog(`Error accessing localStorage: ${e}`);
    }
    
    addLog('Cache clearing completed, reload the page to see effects');
  };

  if (!ENABLE_DEBUG) {
    return null;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-orange-50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Google Maps Diagnostics</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardHeader>
      
      {showDetails && (
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-sm">Google Maps Status</h3>
              <div className="border p-3 rounded-md bg-gray-50 text-sm">
                <p><span className="font-medium">API Status:</span> {googleStatus}</p>
                <p><span className="font-medium">Script Status:</span> {scriptStatus}</p>
                <p><span className="font-medium">DOM Ready:</span> {domReady ? 'Yes' : 'No'}</p>
                <p><span className="font-medium">API Key Present:</span> {GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-sm">Actions</h3>
              <div className="flex flex-col space-y-2">
                <Button onClick={loadMapsManually} size="sm">
                  Load Maps API Manually
                </Button>
                <Button onClick={clearMapsCache} variant="destructive" size="sm">
                  Clear Google Maps Cache
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2 text-sm">Debug Log</h3>
            <div className="border rounded-md bg-gray-800 p-3 h-48 overflow-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                {logEntries.join('\n')}
              </pre>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default MapDebugPanel; 