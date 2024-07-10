# Dormitory Navigation Project

This project is a dormitory navigation application built with Vue.js and Leaflet. It allows users to view a floor plan of the dormitory, add markers to specific locations, and see both SVG and GPS coordinates for those markers. The markers are persisted across sessions using local storage.

## Features

- Display a floor plan using an SVG or rasterized image overlay.
- Add markers to the map by clicking.
- Show both SVG and GPS coordinates in marker popups.
- Clear all markers.
- Persist markers across sessions.
- Display user's current location using device GPS.

## Installation

1. Clone the repository:

    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Run the development server:

    ```bash
    npm run serve
    ```

4. Open your browser and navigate to `http://localhost:8080`.

## File Structure

- `public/`
  - `map.html` - The SVG file embedded in an HTML document.
  - `map.png` - A rasterized version of the SVG file.
  - `marker-icon.png`, `marker-shadow.png` - Custom marker icons.
- `src/`
  - `App.vue` - The main Vue component.
  - `main.js` - The entry point for the Vue application.
- `package.json` - Project configuration and dependencies.

## Code Explanation

### App.vue

This is the main Vue component where the map is initialized and the functionalities are implemented.

#### Data Properties

- `map`: The Leaflet map instance.
- `markers`: An array to store the added markers.
- `knownPoints`: An array of known points for SVG to GPS conversion.

#### Mounted Hook

- `initMap()`: Initializes the Leaflet map.
- `loadMarkers()`: Loads markers from local storage.
- `getGeolocation()`: Gets the user's current location using device GPS.
- `loadRasterizedSvg()`: Loads the rasterized SVG overlay.

#### Methods

- `initMap()`: Initializes the Leaflet map with custom CRS and adds controls.
- `loadRasterizedSvg()`: Fetches and displays the rasterized SVG overlay.
- `getGeolocation()`: Gets the user's current location and sets the map view.
- `addMarker(event)`: Adds a marker to the map and saves it to local storage.
- `createPopupContent(markerCoordinates, gpsCoordinates)`: Creates content for the marker popups displaying both SVG and GPS coordinates.
- `debouncedSaveMarkers()`: Debounced function to save markers.
- `saveMarkers()`: Saves markers to local storage.
- `loadMarkers()`: Loads markers from local storage.
- `clearMarkers()`: Clears all markers from the map and local storage.
- `transformToSvg(lat, lon)`: Transforms GPS coordinates to SVG coordinates.
- `transformToGps(x, y)`: Transforms SVG coordinates to GPS coordinates.
- `bilinearInterpolation()`: Helper function for coordinate transformation.
- `addTestMarker()`: Adds a test marker at specified SVG coordinates.

### main.js

This file initializes the Vue application and mounts it to the DOM.

```javascript
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
