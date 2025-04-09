/**
 * Application constants
 */

// Maps - ensure we have a fallback for local development
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Flag to enable detailed debug output
export const ENABLE_DEBUG = true;

// API endpoints and settings
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Default center for the map (Port Charlotte, FL)
export const DEFAULT_MAP_CENTER: { lat: number; lng: number } = {
  lat: 26.9945, // Latitude for Port Charlotte
  lng: -82.0887 // Longitude for Port Charlotte
};

// Default boundaries for the map to restrict panning/zooming (approx 15-mile radius around Port Charlotte)
const RADIUS_DEGREES = 0.22; // Approximate degrees for 15 miles at this latitude
export const DEFAULT_MAP_BOUNDS = {
  north: DEFAULT_MAP_CENTER.lat + RADIUS_DEGREES,
  south: DEFAULT_MAP_CENTER.lat - RADIUS_DEGREES,
  east: DEFAULT_MAP_CENTER.lng + RADIUS_DEGREES / Math.cos(DEFAULT_MAP_CENTER.lat * Math.PI / 180), // Adjust longitude bounds based on latitude
  west: DEFAULT_MAP_CENTER.lng - RADIUS_DEGREES / Math.cos(DEFAULT_MAP_CENTER.lat * Math.PI / 180)
};

// Map configuration settings
export const MAP_CONFIG = {
  defaultZoom: 11, // Adjusted zoom level for a 15-mile radius view
  maxRadius: 24140, // 15 miles in meters
  defaultBounds: DEFAULT_MAP_BOUNDS,
  // Add any other map-related configurations here
};

// Set to true to use the Nominatim fallback for geocoding when Google Maps is not available
export const USE_NOMINATIM_FALLBACK = true;

// Maximum attempts for geocoding
export const MAX_GEOCODING_ATTEMPTS = 3;

// Test API key to use if environment variable is not set
export const TEST_MAPS_API_KEY = 'AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Fake key for testing 

// Batch size for geocoding requests to avoid overwhelming the API
export const GEOCODE_BATCH_SIZE = 5;

// Add other constants below if needed... 