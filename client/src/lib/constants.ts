/**
 * Application constants
 */

// Maps - ensure we have a fallback for local development
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Flag to enable detailed debug output
export const ENABLE_DEBUG = true;

// API endpoints and settings
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Default coordinates for when geocoding fails (centered on Port Charlotte, Florida)
export const DEFAULT_MAP_CENTER = {
  lat: 26.9796, // Port Charlotte, Florida center
  lng: -82.0998
};

// Set to true to use the Nominatim fallback for geocoding when Google Maps is not available
export const USE_NOMINATIM_FALLBACK = true;

// Maximum attempts for geocoding
export const MAX_GEOCODING_ATTEMPTS = 3;

// Test API key to use if environment variable is not set
export const TEST_MAPS_API_KEY = 'AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Fake key for testing 

// Batch size for geocoding requests to avoid overwhelming the API
export const GEOCODE_BATCH_SIZE = 5; 