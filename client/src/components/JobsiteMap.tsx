import React, { useEffect, useRef } from 'react';
import { Jobsite, Marker } from '../types';

interface JobsiteMapProps {
  jobsites: Jobsite[];
  markers?: Marker[];
}

declare global {
  interface Window {
    google?: any;
    initMap?: () => void;
  }
}

export const JobsiteMap: React.FC<JobsiteMapProps> = ({ jobsites, markers = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // This would be replaced with actual Google Maps integration
    // For the MVP, we're creating a simplified map visualization
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = true;
      initSimpleMap();
    }
  }, []);

  const initSimpleMap = () => {
    if (!mapRef.current) return;
    
    const mapContainer = mapRef.current;
    
    // Clear existing content
    mapContainer.innerHTML = '';
    
    // Create a simple map representation
    const mapElement = document.createElement('div');
    mapElement.className = 'relative w-full h-full bg-gray-200 rounded-xl overflow-hidden';
    
    // Add styling to make it look like a map
    mapElement.style.backgroundImage = 'url("https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/0,0,2/600x400?access_token=placeholder")';
    mapElement.style.backgroundSize = 'cover';
    mapElement.style.backgroundPosition = 'center';
    
    // Add jobsite markers
    jobsites.forEach((jobsite, index) => {
      const marker = document.createElement('div');
      marker.className = 'absolute w-8 h-8 rounded-full flex items-center justify-center text-white transform -translate-x-1/2 -translate-y-1/2';
      
      // Position randomly for the mock
      const top = 20 + (index * 15) + Math.random() * 40;
      const left = 20 + (index * 20) + Math.random() * 50;
      
      marker.style.top = `${top}%`;
      marker.style.left = `${left}%`;
      
      // Color based on status
      if (jobsite.status.toLowerCase().includes('delayed')) {
        marker.classList.add('bg-primary');
      } else if (jobsite.status.toLowerCase().includes('weather')) {
        marker.classList.add('bg-warning');
      } else {
        marker.classList.add('bg-success');
      }
      
      // Add icon
      marker.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7l12 12 8-10"></path></svg>';
      
      // Add tooltip
      marker.title = `${jobsite.name} - ${jobsite.status}`;
      
      mapElement.appendChild(marker);
    });
    
    // Add custom markers if provided
    markers.forEach((marker, index) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'absolute w-8 h-8 rounded-full flex items-center justify-center text-white transform -translate-x-1/2 -translate-y-1/2';
      
      markerElement.style.top = `${marker.position.lat}%`;
      markerElement.style.left = `${marker.position.lng}%`;
      markerElement.classList.add(marker.color || 'bg-secondary');
      
      // Add icon based on type
      if (marker.type === 'truck') {
        markerElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>';
      } else if (marker.type === 'alert') {
        markerElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      } else {
        markerElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>';
      }
      
      mapElement.appendChild(markerElement);
    });
    
    mapContainer.appendChild(mapElement);
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-xl p-4">
      <h2 className="text-xl font-bold text-dark mb-3">JOBSITE LOCATIONS</h2>
      
      <div 
        ref={mapRef} 
        className="bg-gray-200 h-80 rounded-xl relative"
        aria-label="Map showing jobsite locations"
      />
    </div>
  );
};
