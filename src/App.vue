<template>
  <div id="app">
    <div id="map" style="height: 500px;"></div>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'App',
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      const map = L.map('map', {
        crs: L.CRS.Simple, // Use a simple coordinate reference system
        minZoom: -1
      });

      // Bounds for the image based on its pixel dimensions
      const bounds = [[0, 0], [1000, 1000]]; // Adjust according to your image size
      const image = L.imageOverlay('path/to/your/floor-plan.jpg', bounds).addTo(map);

      // Set the view to the center of the image
      map.fitBounds(bounds);

      // Example of adding a marker with GPS-like coordinates
      const markerCoordinates = map.unproject([500, 500], map.getMaxZoom()); // Adjust these values based on your needs
      L.marker(markerCoordinates).addTo(map).bindPopup('A point of interest');
    }
  }
}
</script>

<style>
#map {
  height: 500px; /* Ensures that the map has a defined height */
}

/* Leaflet CSS */
@import "~leaflet/dist/leaflet.css";
</style>