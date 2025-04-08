import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useLocation } from 'wouter';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER } from '@/lib/constants';

// Define the shape of each project with location data
interface MapProject {
  id: number;
  name: string;
  address?: string;
  status: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  progress?: number;
}

interface ProjectsMapProps {
  projects: MapProject[];
  height?: string;
  width?: string;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  onMarkerClick?: (project: MapProject) => void;
  navigateToProject?: (projectId: number) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Map options for styling and controls
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
};

// Define the DebugInfo interface for type safety
interface DebugInfo {
  apiLoaded: boolean;
  scriptElement: string;
  projectsCount: number;
  validProjectsCount: number;
  mapInstance: boolean;
  lastError: any;
  attempts: number;
  googleAvailable: boolean;
  checkTime?: string;
  mapLoadTime?: string;
  boundsError?: any;
  iconError?: any;
}

// Debug function to check Google Maps API status
const debugGoogleMaps = () => {
  console.log('[DEBUG] Google Maps status:');
  console.log('- window.google exists:', !!window.google);
  console.log('- window.google.maps exists:', !!(window.google?.maps));
  console.log('- window.mapsDebug:', window.mapsDebug);
  
  // Check if API key is being loaded
  const scripts = document.querySelectorAll('script');
  let mapsScriptFound = false;
  
  scripts.forEach(script => {
    if (script.src && script.src.includes('maps.googleapis.com')) {
      mapsScriptFound = true;
      console.log('- Maps script found:', script.src);
    }
  });
  
  if (!mapsScriptFound) {
    console.error('No Google Maps script tag found in document!');
  }
  
  return {
    hasGoogle: !!window.google,
    hasMaps: !!(window.google?.maps),
    scriptFound: mapsScriptFound
  };
};

export const ProjectsMap = ({
  projects,
  height = '500px',
  width = '100%',
  centerLat = DEFAULT_MAP_CENTER.lat,
  centerLng = DEFAULT_MAP_CENTER.lng,
  zoom = 10,
  onMarkerClick,
  navigateToProject,
}: ProjectsMapProps) => {
  const [, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    apiLoaded: false,
    scriptElement: 'Not checked',
    projectsCount: 0,
    validProjectsCount: 0,
    mapInstance: false,
    lastError: null,
    attempts: 0,
    googleAvailable: false
  });

  // Log initialization for debugging
  useEffect(() => {
    console.log('ProjectsMap initializing', {
      projectsCount: projects.length,
      projectsWithValidCoords: projects.filter(p => 
        typeof p.latitude === 'number' && typeof p.longitude === 'number'
      ).length,
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Present (masked)' : 'Missing',
      windowGoogle: typeof window !== 'undefined' && window.google ? 'Present' : 'Not available',
    });

    // Check DOM for existing script elements
    if (typeof document !== 'undefined') {
      const scriptTags = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      setDebugInfo((prev: DebugInfo) => ({
        ...prev,
        scriptElement: `Found ${scriptTags.length} script tags`,
        googleAvailable: typeof window !== 'undefined' && !!window.google
      }));
    }

    return () => {
      console.log('ProjectsMap unmounting');
    };
  }, [projects]);

  // Use the GoogleMaps JS API loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    // Add additional libraries if needed
    // libraries: ['places']
  });

  // Update debug info when load status changes
  useEffect(() => {
    setDebugInfo((prev: DebugInfo) => ({
      ...prev,
      apiLoaded: isLoaded,
      lastError: loadError,
      attempts: prev.attempts + 1
    }));

    if (loadError) {
      console.error('Error loading Google Maps API:', loadError);
      setMapError(`Failed to load Google Maps: ${loadError.message || 'Unknown error'}`);
    }
  }, [isLoaded, loadError]);

  // Log when Google object becomes available
  useEffect(() => {
    const checkGoogleObject = () => {
      const googleAvailable = typeof window !== 'undefined' && !!window.google && !!window.google.maps;
      setDebugInfo((prev: DebugInfo) => ({ 
        ...prev, 
        googleAvailable,
        checkTime: new Date().toISOString()
      }));
      return googleAvailable;
    };

    // Check immediately
    if (checkGoogleObject()) return;

    // If not available, set up an interval to check
    const intervalId = setInterval(() => {
      if (checkGoogleObject()) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Callback when map is loaded
  const onLoad = useCallback((map: google.maps.Map) => {
    console.log('Google Map loaded successfully');
    mapRef.current = map;
    setDebugInfo((prev: DebugInfo) => ({ 
      ...prev, 
      mapInstance: true,
      mapLoadTime: new Date().toISOString()
    }));
    
    // If we have a single project with valid coordinates, set center and zoom here
    if (projects.length === 1) {
      const project = projects[0];
      if (project.latitude != null && project.longitude != null) {
        console.log(`[ProjectsMap] Centering on single project: ${project.name} at ${project.latitude}, ${project.longitude}`);
        const center = { 
          lat: Number(project.latitude), 
          lng: Number(project.longitude) 
        };
        map.setCenter(center);
        map.setZoom(zoom || 15); // Use provided zoom or default to 15 for single project
      }
    } 
    // For multiple projects, fit bounds
    else if (projects.length > 1) {
      console.log(`[ProjectsMap] Fitting bounds for ${projects.length} projects`);
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoordinates = false;
      
      projects.forEach(project => {
        if (project.latitude != null && project.longitude != null) {
          console.log(`[ProjectsMap] Adding project to bounds: ${project.name} at ${project.latitude}, ${project.longitude}`);
          bounds.extend({ 
            lat: Number(project.latitude), 
            lng: Number(project.longitude) 
          });
          hasValidCoordinates = true;
        } else {
          console.log(`[ProjectsMap] Skipping project without coordinates: ${project.name}`);
        }
      });
      
      if (hasValidCoordinates) {
        map.fitBounds(bounds);
        console.log('[ProjectsMap] Bounds applied to map');
      } else {
        console.log('[ProjectsMap] No valid coordinates to fit bounds');
      }
    }
  }, [projects, zoom]);

  // Callback when map is unmounted
  const onUnmount = useCallback(() => {
    console.log('Google Map unmounted');
    mapRef.current = null;
    setDebugInfo((prev: DebugInfo) => ({ ...prev, mapInstance: false }));
  }, []);

  // Calculate map center based on project locations or use provided center
  const getMapCenter = () => {
    const validProjects = projects.filter(project => 
      typeof project.latitude === 'number' && typeof project.longitude === 'number'
    );
    
    if (validProjects.length === 0) {
      console.log('[ProjectsMap] No projects, using default center');
      return { lat: centerLat, lng: centerLng };
    }

    // If we have a single project with valid coordinates, center on it
    if (validProjects.length === 1) {
      const project = validProjects[0];
      if (project.latitude != null && project.longitude != null) {
        console.log(`[ProjectsMap] Centering on: ${project.latitude}, ${project.longitude}`);
        return { 
          lat: Number(project.latitude), 
          lng: Number(project.longitude) 
        };
      }
    }
    
    // Return default center (bounds fitting happens in onLoad)
    console.log('[ProjectsMap] Using default center');
    return { lat: centerLat, lng: centerLng };
  };

  // Get marker icon based on project status
  const getMarkerIcon = (status: string) => {
    // Define different icons based on status 
    const getColor = () => {
      switch (status) {
        case 'active': return 'green';
        case 'completed': return 'blue';
        case 'scheduled': return 'orange';
        default: return 'red';
      }
    };

    try {
      return {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: getColor(),
        fillOpacity: 0.9,
        strokeWeight: 2,
        strokeColor: 'white',
        scale: 10,
        anchor: new window.google.maps.Size(15, 15) // Center the icon
      };
    } catch (error) {
      console.error('Error creating marker icon:', error);
      setDebugInfo((prev: DebugInfo) => ({ ...prev, iconError: error }));
      // Return a simpler icon definition that doesn't rely on google.maps objects
      return {
        path: 0, // A simple circle
        fillColor: getColor(),
        fillOpacity: 0.9,
        strokeWeight: 2,
        strokeColor: 'white',
        scale: 10
      };
    }
  };

  // Navigate to project page when marker is clicked
  const handleMarkerClick = (project: MapProject) => {
    console.log('[ProjectsMap] Marker clicked:', project);
    setSelectedProject(project);
    if (onMarkerClick) {
      onMarkerClick(project);
    }
  };

  // Navigate to project details page
  const handleNavigateToProject = (projectId: number) => {
    console.log('[ProjectsMap] Navigating to project:', projectId);
    if (navigateToProject) {
      navigateToProject(projectId);
    } else {
      setLocation(`/projects/${projectId}`);
    }
  };

  // Add debugging UI components
  const renderDebugInfo = () => {
    if (!debugInfo.attempts) return null;
    
    return (
      <div className="bg-white/90 p-2 text-xs absolute bottom-0 left-0 right-0 z-10 text-black font-mono">
        <div className="overflow-auto max-h-24">
          <p>API Loaded: {debugInfo.apiLoaded ? '✅' : '❌'} | Google Available: {debugInfo.googleAvailable ? '✅' : '❌'}</p>
          <p>Map Instance: {debugInfo.mapInstance ? '✅' : '❌'} | Projects: {debugInfo.validProjectsCount}/{debugInfo.projectsCount}</p>
          {debugInfo.lastError && <p className="text-red-600">Error: {String(debugInfo.lastError)}</p>}
          <p>Scripts: {debugInfo.scriptElement}</p>
        </div>
      </div>
    );
  };

  // Show error if map fails to load
  if (mapError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <p className="text-red-500 mb-2">❌ {mapError}</p>
        <p className="text-sm text-gray-600 mb-4">
          Please check your Google Maps API key configuration
        </p>
        <div className="text-left bg-gray-200 p-4 rounded-md text-xs overflow-auto w-full max-w-md">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!isLoaded || !window.google || !window.google.maps) {
    // Check directly if Google Maps is available
    const mapsAvailable = !!(window.google && window.google.maps);
    
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="flex items-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <span>Loading map...</span>
        </div>
        
        <div className="text-xs text-gray-500">
          Maps API loaded: {mapsAvailable ? 'Yes' : 'No'}
        </div>
      </div>
    );
  }

  // Check if we have any projects with valid coordinates
  const validProjects = projects.filter(project => 
    typeof project.latitude === 'number' && typeof project.longitude === 'number'
  );
  
  console.log(`[ProjectsMap] Valid projects with coordinates: ${validProjects.length} out of ${projects.length}`);
  
  if (validProjects.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 text-center p-4">
        <div>
          <p className="text-red-500 font-semibold mb-2">No location data available for projects</p>
          <p className="text-sm text-gray-600 mb-4">Projects need latitude and longitude coordinates to be displayed on the map</p>
          <div className="text-left bg-gray-200 p-4 rounded-md text-xs overflow-auto w-full max-w-md">
            <p className="font-semibold mb-2">Debug Info:</p>
            <ul>
              {projects.map(project => (
                <li key={project.id}>
                  {project.name}: {project.latitude ? '✓' : '✗'} lat, {project.longitude ? '✓' : '✗'} lng
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, width }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={getMapCenter()}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {validProjects.map(project => (
          <Marker
            key={project.id}
            position={{ 
              lat: Number(project.latitude), 
              lng: Number(project.longitude) 
            }}
            onClick={() => handleMarkerClick(project)}
            icon={getMarkerIcon(project.status)}
          />
        ))}

        {selectedProject && selectedProject.latitude != null && selectedProject.longitude != null && (
          <InfoWindow
            position={{ 
              lat: Number(selectedProject.latitude), 
              lng: Number(selectedProject.longitude) 
            }}
            onCloseClick={() => setSelectedProject(null)}
          >
            <div className="p-2">
              <h3 className="font-bold text-lg">{selectedProject.name}</h3>
              {selectedProject.address && <p className="text-sm text-gray-600">{selectedProject.address}</p>}
              <p className="text-sm mt-1">Status: <span className="capitalize">{selectedProject.status}</span></p>
              {selectedProject.progress !== undefined && (
                <div className="mt-2">
                  <div className="text-xs mb-1">Progress: {selectedProject.progress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${selectedProject.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <button 
                className="mt-3 px-4 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                onClick={() => handleNavigateToProject(selectedProject.id)}
              >
                View Details
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      {renderDebugInfo()}
    </div>
  );
};

// Add global type for window with mapsDebug
declare global {
  interface Window {
    google?: any;
    mapsDebug?: {
      apiKey: boolean;
      apiLoaded: boolean;
      error: string | null;
    };
    initMap?: () => void;
    gm_authFailure?: () => void;
  }
}

export default ProjectsMap; 