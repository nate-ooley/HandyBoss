import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define crew member with location
interface MapCrewMember {
  id: number;
  name: string;
  role: string;
  avatarChoice?: number;
  profileImage?: string | null;
  currentLatitude: number;
  currentLongitude: number;
  lastCheckIn?: string;
  status?: string;
}

interface CrewMapProps {
  crewMembers: MapCrewMember[];
  height?: string;
  width?: string;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
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

export const CrewMap = ({
  crewMembers,
  height = '500px',
  width = '100%',
  centerLat = 37.7749, // Default to San Francisco
  centerLng = -122.4194,
  zoom = 10,
}: CrewMapProps) => {
  const [, setLocation] = useLocation();
  const [selectedCrewMember, setSelectedCrewMember] = useState<MapCrewMember | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Load the Google Maps JavaScript API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Callback when map is loaded
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Callback when map is unmounted
  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Calculate map center based on crew member locations or use provided center
  const getMapCenter = () => {
    if (crewMembers.length === 0) {
      return { lat: centerLat, lng: centerLng };
    }

    // If we have multiple crew members, fit bounds around them
    if (crewMembers.length > 1 && mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      crewMembers.forEach(member => {
        bounds.extend({ lat: member.currentLatitude, lng: member.currentLongitude });
      });
      mapRef.current.fitBounds(bounds);
    }

    return { lat: centerLat, lng: centerLng };
  };

  // Get status color for member
  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-500";
    
    switch (status) {
      case 'active':
        return "bg-green-500";
      case 'on-leave':
        return "bg-yellow-500";
      case 'terminated':
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Handle marker click
  const handleMarkerClick = (crewMember: MapCrewMember) => {
    setSelectedCrewMember(crewMember);
  };

  // Navigate to crew member profile
  const navigateToProfile = (memberId: number) => {
    setLocation(`/crew/${memberId}`);
  };

  if (!isLoaded) {
    return <div className="h-full w-full flex items-center justify-center bg-gray-100">Loading map...</div>;
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
        {crewMembers.map(member => (
          <Marker
            key={member.id}
            position={{ lat: member.currentLatitude, lng: member.currentLongitude }}
            onClick={() => handleMarkerClick(member)}
            icon={{ url: '/icons/marker-worker.svg', scaledSize: new window.google.maps.Size(30, 30) }}
          />
        ))}

        {selectedCrewMember && (
          <InfoWindow
            position={{ 
              lat: selectedCrewMember.currentLatitude, 
              lng: selectedCrewMember.currentLongitude 
            }}
            onCloseClick={() => setSelectedCrewMember(null)}
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10">
                  {selectedCrewMember.profileImage ? (
                    <AvatarImage src={selectedCrewMember.profileImage} alt={selectedCrewMember.name} />
                  ) : (
                    <AvatarFallback>
                      {selectedCrewMember.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-bold text-base">{selectedCrewMember.name}</h3>
                  <p className="text-xs text-gray-500">{selectedCrewMember.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedCrewMember.status)}`}></div>
                <span className="text-sm capitalize">{selectedCrewMember.status || "Unknown"}</span>
              </div>
              
              {selectedCrewMember.lastCheckIn && (
                <p className="text-xs text-gray-600 mb-2">
                  Last check-in: {new Date(selectedCrewMember.lastCheckIn).toLocaleString()}
                </p>
              )}
              
              <button 
                className="mt-1 px-4 py-1 bg-blue-500 text-white rounded-md text-sm w-full hover:bg-blue-600 transition-colors"
                onClick={() => navigateToProfile(selectedCrewMember.id)}
              >
                View Profile
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default CrewMap; 