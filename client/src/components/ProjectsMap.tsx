import React, { useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useLocation } from 'wouter';
import { DEFAULT_MAP_CENTER, MAP_CONFIG } from '@/lib/constants';

// Define libraries array outside the component with the correct type
// const googleMapsLibraries = ['geometry'] as const; // Use 'as const' for stricter typing if needed, or adjust type below
// Alternatively, explicitly type if the above causes issues:
const googleMapsLibraries: Array<"places" | "drawing" | "geometry" | "visualization"> = ["geometry"];

// Fallback component when Google Maps fails to load
const MapLoadingFallback = ({ 
  error = "Loading map...", 
  height = '500px', 
  width = '100%' 
}: { 
  error?: string, 
  height?: string, 
  width?: string 
}) => (
  <div 
    style={{ 
      width: width, 
      height: height, 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px'
    }}
  >
    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
      {error}
    </div>
  </div>
);

// Types for the project with coordinates
interface MapProject {
  id: number;
  name: string;
  address?: string;
  status: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  progress?: number;
}

// Props for the map component
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

// Map options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  restriction: {
    latLngBounds: MAP_CONFIG.defaultBounds,
    strictBounds: false,
  }
};

// Global type for Google Maps
declare global {
  interface Window {
    google?: any;
  }
}

function ProjectsMap({
  projects,
  height = '500px',
  width = '100%',
  centerLat = DEFAULT_MAP_CENTER.lat,
  centerLng = DEFAULT_MAP_CENTER.lng,
  zoom = MAP_CONFIG.defaultZoom,
  onMarkerClick,
  navigateToProject,
}: ProjectsMapProps) {
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null);
  const [, setLocation] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);
  
  // Log the raw projects data received
  console.log("Raw projects received by ProjectsMap:", projects);

  // Load Google Maps using the stable libraries array
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: googleMapsLibraries,
  });

  // Filter projects only after Google Maps is loaded and geometry library is available
  const projectsWithCoordinates = useMemo(() => {
    // Log when filtering starts and the state of isLoaded
    console.log(`Filtering projects. isLoaded: ${isLoaded}, geometry available: ${!!(window.google && window.google.maps && window.google.maps.geometry)}`);

    // Explicitly check for Maps API and geometry library readiness
    if (!isLoaded || !window.google || !window.google.maps || !window.google.maps.geometry) {
      return []; // Return empty array if maps or geometry lib aren't ready
    }

    return projects.filter(project => {
      // Log details for each project being filtered
      console.log(`Filtering project ID: ${project.id}, Lat: ${project.latitude}, Lng: ${project.longitude}`);
      
      if (!project.latitude || !project.longitude) {
        console.log(` -> Project ${project.id} excluded: Missing coordinates.`);
        return false;
      }
      if (isNaN(Number(project.latitude)) || isNaN(Number(project.longitude))) {
        console.log(` -> Project ${project.id} excluded: Invalid coordinates.`);
        return false;
      }

      // Calculate distance from center point
      // This code now safely runs only after 'isLoaded' and geometry check
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(Number(project.latitude), Number(project.longitude)),
        new window.google.maps.LatLng(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng)
      );

      // Log distance calculation
      console.log(` -> Project ${project.id} distance: ${distance.toFixed(2)}m, Max radius: ${MAP_CONFIG.maxRadius}m`);

      // Only include projects within the maxRadius
      const withinRadius = distance <= MAP_CONFIG.maxRadius;
      if (!withinRadius) {
        console.log(` -> Project ${project.id} excluded: Outside max radius.`);
      }
      return withinRadius;
    });
  }, [projects, isLoaded]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    // Set initial bounds
    const bounds = new window.google.maps.LatLngBounds(
      { lat: MAP_CONFIG.defaultBounds.south, lng: MAP_CONFIG.defaultBounds.west },
      { lat: MAP_CONFIG.defaultBounds.north, lng: MAP_CONFIG.defaultBounds.east }
    );
    map.fitBounds(bounds);
    
    // Don't zoom in too far
    listenerRef.current = window.google.maps.event.addListenerOnce(map, 'idle', () => {
      if (map.getZoom()! > MAP_CONFIG.defaultZoom) {
        map.setZoom(MAP_CONFIG.defaultZoom);
      }
    });

    // Do not return cleanup function here
  }, []);

  // Map cleanup
  const onUnmount = useCallback(() => {
    if (listenerRef.current) {
      window.google.maps.event.removeListener(listenerRef.current);
      listenerRef.current = null;
    }
    mapRef.current = null;
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((project: MapProject) => {
    setSelectedProject(project);
    if (onMarkerClick) {
      onMarkerClick(project);
    }
  }, [onMarkerClick]);

  // Navigate to project detail
  const handleNavigateToProject = useCallback((projectId: number) => {
    setSelectedProject(null);
    if (navigateToProject) {
      navigateToProject(projectId);
    } else {
      setLocation(`/projects/${projectId}`);
    }
  }, [navigateToProject, setLocation]);

  // Get marker color based on status
  const getMarkerColor = useCallback((status: string): string => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'completed': return '#3b82f6';
      case 'scheduled': return '#f59e0b';
      default: return '#ef4444';
    }
  }, []);

  // If no projects with coordinates
  if (projectsWithCoordinates.length === 0) {
    return (
      <div
        style={{
          width: width,
          height: height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
          No projects with location data
        </div>
        <div style={{ textAlign: 'center', maxWidth: '80%', marginBottom: '15px' }}>
          Add coordinates to your projects to see them on the map
        </div>
      </div>
    );
  }

  // If Google Maps failed to load
  if (loadError) {
    return (
      <MapLoadingFallback 
        error={`Error loading Google Maps: ${loadError.message}`}
        height={height}
        width={width}
      />
    );
  }

  // If still loading
  if (!isLoaded) {
    return (
      <MapLoadingFallback 
        error="Loading map..."
        height={height}
        width={width}
      />
    );
  }

  // Render the map
  return (
    <div style={{ width: width, height: height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: centerLat, lng: centerLng }}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {projectsWithCoordinates.map((project) => {
          if (!project.latitude || !project.longitude) return null;
          
          const position = {
            lat: Number(project.latitude),
            lng: Number(project.longitude)
          };

          // Skip invalid coordinates
          if (isNaN(position.lat) || isNaN(position.lng)) return null;

          // Simple marker with colored circle
          const markerIcon = {
            path: typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.SymbolPath
              ? window.google.maps.SymbolPath.CIRCLE
              : 0, // Simple circle fallback when Google Maps isn't loaded
            fillColor: getMarkerColor(project.status),
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            scale: 10
          };

          return (
            <Marker
              key={project.id}
              position={position}
              onClick={() => handleMarkerClick(project)}
              title={project.name}
              icon={markerIcon}
            />
          );
        })}

        {selectedProject && selectedProject.latitude && selectedProject.longitude && (
          <InfoWindow
            position={{
              lat: Number(selectedProject.latitude),
              lng: Number(selectedProject.longitude)
            }}
            onCloseClick={() => setSelectedProject(null)}
          >
            <div style={{ padding: '5px', maxWidth: '200px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{selectedProject.name}</div>
              {selectedProject.address && (
                <div style={{ fontSize: '12px', marginBottom: '5px' }}>{selectedProject.address}</div>
              )}
              {selectedProject.progress !== undefined && (
                <div style={{ 
                  height: '6px', 
                  width: '100%', 
                  backgroundColor: '#e5e7eb',
                  borderRadius: '3px',
                  marginBottom: '5px'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${selectedProject.progress}%`, 
                    backgroundColor: '#2563eb',
                    borderRadius: '3px'
                  }} />
                </div>
              )}
              <button
                onClick={() => handleNavigateToProject(selectedProject.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginTop: '5px'
                }}
              >
                View Details
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default ProjectsMap; 