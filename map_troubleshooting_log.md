# ProjectsMap Component Troubleshooting Log

This document summarizes the issues encountered and fixes applied while debugging the `client/src/components/ProjectsMap.tsx` component.

## Issue 1: White Screen / `process is not defined` Error

*   **Symptom:** Blank white screen when loading the page containing the map. Browser console showed `Uncaught ReferenceError: process is not defined at ProjectsMap.tsx:94`.
*   **Cause:** The code at line 94 was attempting to access an environment variable (`VITE_GOOGLE_MAPS_API_KEY`) using `process.env.VITE_GOOGLE_MAPS_API_KEY`. The `process` object is available in Node.js (server-side) but not in the browser (client-side).
*   **Fix:** Changed `process.env.VITE_GOOGLE_MAPS_API_KEY` to `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`. Vite exposes environment variables prefixed with `VITE_` on the client via the `import.meta.env` object.
*   **Note:** We also suspected potential build caching issues with Vite. Clearing the cache (`rm -rf client/node_modules/.vite`) and restarting the server was attempted during troubleshooting.

## Issue 2: `Cannot read properties of undefined (reading 'spherical')` Error

*   **Symptom:** Map flashed briefly or failed to render projects. Browser console showed `Uncaught TypeError: Cannot read properties of undefined (reading 'spherical')` at various lines within the component (e.g., 104, 105, 109).
*   **Cause:** The code was trying to use `google.maps.geometry.spherical.computeDistanceBetween(...)` (within the project filtering logic) before the Google Maps JavaScript API and the required `geometry` library were fully loaded and initialized.
*   **Fixes:**
    1.  **Load Geometry Library:** Ensured the `geometry` library was explicitly requested in the `useJsApiLoader` hook options: `libraries: ['geometry']`.
    2.  **Conditional Logic:** Wrapped the project filtering logic (where `computeDistanceBetween` is called) inside a `useMemo` hook.
    3.  **Readiness Check:** Added an explicit check at the beginning of the `useMemo` callback to ensure not only `isLoaded` (from `useJsApiLoader`) was true, but also that the necessary Google Maps objects were available:
        ```javascript
        if (!isLoaded || !window.google || !window.google.maps || !window.google.maps.geometry) {
          return []; // Don't proceed if not ready
        }
        ```
        This prevents the distance calculation from running prematurely.

## Issue 3: Confusion Over Component Rendering

*   **Symptom:** Errors related to `ProjectsMap` persisted even after attempts to comment out the `<TabsContent value="map">` section in `client/src/pages/Projects.tsx`.
*   **Cause:** The `ProjectsMap` component was actually being rendered conditionally within the `<TabsContent value="active">` section, controlled by a `showMap` state variable, not within a dedicated "map" tab as initially assumed.
*   **Resolution:** Identified the correct location of the `ProjectsMap` rendering logic within the "Active" tab's content, allowing targeted debugging of the component itself. 