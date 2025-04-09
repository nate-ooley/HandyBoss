import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useLocation } from 'wouter';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';

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
  zoom = 10,
  onMarkerClick,
  navigateToProject,
}: ProjectsMapProps) {
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null);
  const [, setLocation] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  
  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Filter projects with valid coordinates
  const projectsWithCoordinates = projects.filter(project => 
    project.latitude != null && 
    project.longitude != null && 
    !isNaN(Number(project.latitude)) && 
    !isNaN(Number(project.longitude))
  );

  // Map loaded handler
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    // If we have projects with coordinates, fit the map to them
    if (projectsWithCoordinates.length > 0) {
      try {
        // If single project, center on it
        if (projectsWithCoordinates.length === 1) {
          const project = projectsWithCoordinates[0];
          if (project.latitude && project.longitude) {
            map.setCenter({ 
              lat: Number(project.latitude), 
              lng: Number(project.longitude) 
            });
            map.setZoom(15);
          }
        } 
        // If multiple projects, fit bounds
        else if (projectsWithCoordinates.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          
          projectsWithCoordinates.forEach(project => {
            if (project.latitude != null && project.longitude != null) {
              bounds.extend({ 
                lat: Number(project.latitude), 
                lng: Number(project.longitude) 
              });
            }
          });
          
          map.fitBounds(bounds);
          
          // Don't zoom in too far on small areas
          window.google.maps.event.addListenerOnce(map, 'idle', () => {
            const currentZoom = map.getZoom();
            if (currentZoom && currentZoom > 15) {
              map.setZoom(15);
            }
          });
        }
      } catch (error) {
        console.error('Error setting map bounds:', error);
        map.setCenter({ lat: centerLat, lng: centerLng });
        map.setZoom(zoom);
      }
    } else {
      // Default center if no projects
      map.setCenter({ lat: centerLat, lng: centerLng });
      map.setZoom(zoom);
    }
  }, [projectsWithCoordinates, centerLat, centerLng, zoom]);

  // Map cleanup
  const onUnmount = useCallback(() => {
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
            path: window.google && window.google.maps && window.google.maps.SymbolPath
              ? window.google.maps.SymbolPath.CIRCLE 
              : 0, // Simple circle fallback if Google Maps API not loaded yet
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