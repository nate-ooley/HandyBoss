/**
 * Application constants
 */

// Maps
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Flag to enable detailed debug output
export const ENABLE_DEBUG = true;

// API endpoints and settings
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Test coordinates for when geocoding fails
export const DEFAULT_MAP_CENTER = {
  lat: 27.9478,  // Florida center
  lng: -82.4584
};

// Test API key to use if environment variable is not set
export const TEST_MAPS_API_KEY = 'AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Fake key for testing 