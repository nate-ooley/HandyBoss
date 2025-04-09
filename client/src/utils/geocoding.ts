/**
 * Utility functions for geocoding addresses to coordinates
 */
import { GOOGLE_MAPS_API_KEY, USE_NOMINATIM_FALLBACK } from '@/lib/constants';
import axios from 'axios';

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

// Define a more detailed response interface for geocoding
export interface GeocodeResponse {
  success: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  error?: string;
  source?: 'google' | 'nominatim' | 'cache';
}

// In-memory cache for geocoding results
const geocodeCache: Record<string, GeocodeResponse> = {};

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Cache timestamp tracking
const cacheTimestamps: Record<string, number> = {};

/**
 * Check if a cached entry is still valid
 */
function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps[key];
  if (!timestamp) return false;
  
  const now = Date.now();
  return (now - timestamp) < CACHE_DURATION;
}

/**
 * Add an entry to the geocoding cache
 */
function addToCache(address: string, response: GeocodeResponse): void {
  const normalizedAddress = address.trim().toLowerCase();
  geocodeCache[normalizedAddress] = response;
  cacheTimestamps[normalizedAddress] = Date.now();
}

/**
 * Get a cached geocoding result if available
 */
function getFromCache(address: string): GeocodeResponse | null {
  const normalizedAddress = address.trim().toLowerCase();
  
  if (geocodeCache[normalizedAddress] && isCacheValid(normalizedAddress)) {
    console.log(`Using cached geocoding result for "${address}"`);
    return { 
      ...geocodeCache[normalizedAddress],
      source: 'cache'
    };
  }
  
  return null;
}

/**
 * Fallback geocoding with Nominatim (OpenStreetMap)
 */
async function geocodeWithNominatim(address: string, normalizedAddress: string): Promise<GeocodeResponse> {
  try {
    console.log(`Geocoding "${address}" with Nominatim API`);
    
    // Use OpenStreetMap's Nominatim service as fallback
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'HandyBoss/1.0'
        }
      }
    );
    
    if (!response.ok) {
      const errorResponse: GeocodeResponse = {
        success: false,
        error: `Nominatim API error: ${response.status} ${response.statusText}`,
        source: 'nominatim'
      };
      return errorResponse;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const coordinates = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
      
      // Cache the successful result
      const successResponse: GeocodeResponse = {
        success: true,
        coordinates,
        source: 'nominatim'
      };
      
      // Store in cache
      addToCache(address, successResponse);
      
      console.log(`Successfully geocoded "${address}" to:`, coordinates);
      return successResponse;
    } else {
      console.warn(`Nominatim geocoding failed for "${address}": No results`);
      const errorResponse: GeocodeResponse = {
        success: false,
        error: 'No results found with Nominatim',
        source: 'nominatim'
      };
      return errorResponse;
    }
  } catch (error: any) {
    console.error(`Nominatim geocoding error for "${address}":`, error);
    const errorResponse: GeocodeResponse = {
      success: false,
      error: `Nominatim geocoding failed: ${error.message}`,
      source: 'nominatim'
    };
    return errorResponse;
  }
}

/**
 * Geocode an address using either Google Maps API or Nominatim (OpenStreetMap) as fallback
 * This implementation includes caching to reduce API calls
 */
export async function geocodeAddress(address: string): Promise<GeocodeResponse> {
  // Normalize the address for caching (lowercase, trim whitespace)
  const normalizedAddress = address.trim().toLowerCase();
  
  // Check cache first to avoid unnecessary API calls
  const cachedResult = getFromCache(address);
  if (cachedResult) {
    return cachedResult;
  }
  
  if (!address || address.trim() === '') {
    console.warn('Attempted to geocode empty address');
    const errorResponse: GeocodeResponse = {
      success: false,
      error: 'Address is empty'
    };
    return errorResponse;
  }

  try {
    // Check if Google Maps is available
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      console.log(`Geocoding "${address}" with Google Maps API`);
      
      return new Promise((resolve) => {
        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address }, (results: any, status: any) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            const coordinates = {
              lat: location.lat(),
              lng: location.lng()
            };
            
            // Cache the successful result
            const successResponse: GeocodeResponse = {
              success: true,
              coordinates,
              source: 'google'
            };
            
            addToCache(address, successResponse);
            
            console.log(`Successfully geocoded "${address}" to:`, coordinates);
            resolve(successResponse);
          } else {
            console.warn(`Google geocoding failed for "${address}": ${status}`);
            
            // If Nominatim fallback is enabled, try that next
            if (USE_NOMINATIM_FALLBACK) {
              geocodeWithNominatim(address, normalizedAddress)
                .then(resolve)
                .catch((error) => {
                  const errorResponse: GeocodeResponse = {
                    success: false,
                    error: `Failed to geocode address with both Google and Nominatim: ${error.message}`
                  };
                  resolve(errorResponse);
                });
            } else {
              const errorResponse: GeocodeResponse = {
                success: false,
                error: `Google geocoding failed: ${status}`
              };
              resolve(errorResponse);
            }
          }
        });
      });
    } else {
      // Google Maps not available, use Nominatim fallback
      if (USE_NOMINATIM_FALLBACK) {
        console.log(`Google Maps not available, using Nominatim for "${address}"`);
        return geocodeWithNominatim(address, normalizedAddress);
      } else {
        const errorResponse: GeocodeResponse = {
          success: false,
          error: 'Google Maps not available and Nominatim fallback is disabled'
        };
        return errorResponse;
      }
    }
  } catch (error: any) {
    console.error(`Geocoding error for "${address}":`, error);
    const errorResponse: GeocodeResponse = {
      success: false,
      error: error.message || 'Unknown geocoding error'
    };
    return errorResponse;
  }
}

/**
 * For backward compatibility - will be deprecated
 */
export async function geocodeAddressWithCache(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const result = await geocodeAddress(address);
  if (result.success && result.coordinates) {
    return {
      latitude: result.coordinates.lat,
      longitude: result.coordinates.lng
    };
  }
  return null;
} 