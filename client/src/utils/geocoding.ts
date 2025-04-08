/**
 * Utility functions for geocoding addresses to coordinates
 */
import { GOOGLE_MAPS_API_KEY } from '@/lib/constants';

// Define Google Maps Geocoder response types
interface GeocodeResult {
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    }
  }
}

type GeocodeStatus = 
  | 'OK'
  | 'ZERO_RESULTS'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR';

/**
 * Convert an address string to latitude and longitude coordinates
 */
export const geocodeAddress = async (address: string): Promise<{latitude: number, longitude: number} | null> => {
  if (!address || address.trim() === '') {
    console.warn('Empty address provided to geocoder');
    return null;
  }

  try {
    // Check if window and google are defined (browser environment)
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
      console.log('Using Google Maps Geocoder API');
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results: GeocodeResult[] | null, status: GeocodeStatus) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            console.log('Geocoded address:', address, 'to', location.lat(), location.lng());
            resolve({
              latitude: location.lat(),
              longitude: location.lng()
            });
          } else {
            console.warn('Geocoding failed:', status, 'for address:', address);
            // For certain error types, we should reject so the app can handle it
            if (status === 'OVER_QUERY_LIMIT' || status === 'REQUEST_DENIED' || status === 'INVALID_REQUEST') {
              reject(new Error(`Geocoding failed: ${status}`));
            } else {
              // For other cases like ZERO_RESULTS, return null
              resolve(null);
            }
          }
        });
      });
    } 
    // Fallback to a free geocoding API
    else {
      console.log('Fallback to Nominatim API - Google Maps not available');
      // Using Nominatim (OpenStreetMap) API - free but has rate limits
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`);
      
      if (!response.ok) {
        console.error('Nominatim API request failed:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        console.log('Geocoded address using Nominatim:', address, 'to', data[0].lat, data[0].lon);
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      console.warn('No results found for address:', address);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', address, error);
    return null;
  }
};

/**
 * Cache for geocoding results to avoid repeated API calls
 */
const geocodingCache = new Map<string, {latitude: number, longitude: number}>();

/**
 * Convert an address string to coordinates with caching
 */
export const geocodeAddressWithCache = async (address: string): Promise<{latitude: number, longitude: number} | null> => {
  if (!address || address.trim() === '') {
    console.warn('Empty address provided to geocoder cache');
    return null;
  }
  
  const normalizedAddress = address.trim().toLowerCase();
  
  // Check if we have a cached result
  if (geocodingCache.has(normalizedAddress)) {
    const cachedResult = geocodingCache.get(normalizedAddress);
    console.log('Using cached geocoding result for:', address);
    return cachedResult || null;
  }
  
  try {
    console.log('Geocoding address:', address);
    const result = await geocodeAddress(address);
    
    // Cache the result if valid
    if (result) {
      geocodingCache.set(normalizedAddress, result);
      console.log('Cached geocoding result for:', address);
    }
    
    return result;
  } catch (error) {
    console.error('Error in geocoding with cache:', error);
    return null;
  }
}; 