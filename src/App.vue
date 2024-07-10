<template>
  <div id="app">
    <div id="map" style="height: 500px;"></div>
    <button @click="clearMarkers">Clear Markers</button>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import _ from 'lodash';

// Set the default icon paths
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'marker-icon-2x.png',
  iconUrl: 'marker-icon.png',
  shadowUrl: 'marker-shadow.png',
});

export default {
  name: 'App',
  data() {
    return {
      map: null,
      markers: []
    };
  },
  mounted() {
    this.initMap();
    this.loadMarkers();
    this.getGeolocation();
    this.loadRasterizedSvg(); // Load the rasterized SVG overlay
  },
  methods: {
    initMap() {
      this.map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1
      });

      if (this.map) {
        const bounds = [[0, 0], [1000, 1000]];
        this.map.fitBounds(bounds);

        L.control.scale({ position: 'bottomright' }).addTo(this.map);
        L.control.scale({ position: 'bottomleft', maxWidth: 100, metric: true, imperial: false }).addTo(this.map);

        this.map.on('click', this.addMarker);
      } else {
        console.error('Map object is undefined. Initialization failed.');
      }
    },
    loadRasterizedSvg() {
      fetch('/map.html')
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const svgElement = doc.querySelector('svg');

          if (svgElement) {
            console.log('SVG Element:', svgElement);
            const svgBounds = [[0, 0], [svgElement.height.baseVal.value, svgElement.width.baseVal.value]];

            // Create an offscreen canvas to rasterize the SVG
            const canvas = document.createElement('canvas');
            canvas.width = svgElement.width.baseVal.value;
            canvas.height = svgElement.height.baseVal.value;
            const ctx = canvas.getContext('2d');

            const svgString = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();
            img.src = 'data:image/svg+xml;base64,' + btoa(svgString);

            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              const pngUrl = canvas.toDataURL('image/png');
              const imageOverlay = L.imageOverlay(pngUrl, svgBounds).addTo(this.map);

              if (imageOverlay) {
                console.log('Rasterized SVG overlay added successfully');
                this.map.fitBounds(svgBounds);
              } else {
                console.error('Failed to add rasterized SVG overlay');
              }
            };

            img.onerror = () => {
              console.error('Failed to load rasterized SVG image');
            };
          } else {
            console.error('SVG element not found in HTML');
          }
        })
        .catch(error => {
          console.error('Error loading SVG overlay:', error);
        });
    },
    getGeolocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            this.map.setView([latitude, longitude], 13);
          },
          error => {
            console.error(error.message);
          }
        );
      }
    },
    addMarker(event) {
      const markerCoordinates = event.latlng;
      const marker = L.marker(markerCoordinates).addTo(this.map).bindPopup(this.createPopupContent(markerCoordinates));
      this.markers.push(marker);
      this.debouncedSaveMarkers();
    },
    createPopupContent(markerCoordinates) {
      return `Coordinates: ${markerCoordinates.lat}, ${markerCoordinates.lng}`;
    },
    debouncedSaveMarkers: _.debounce(function() {
      this.saveMarkers();
    }, 500),
    saveMarkers() {
      const markerData = this.markers.map(marker => ({
        lat: marker.getLatLng().lat,
        lng: marker.getLatLng().lng,
        popup: marker.getPopup().getContent()
      }));
      localStorage.setItem('markers', JSON.stringify(markerData));
    },
    loadMarkers() {
      const markerData = JSON.parse(localStorage.getItem('markers'));
      if (markerData) {
        markerData.forEach(data => {
          const marker = L.marker([data.lat, data.lng]).addTo(this.map).bindPopup(data.popup);
          this.markers.push(marker);
        });
      }
    },
    clearMarkers() {
      this.markers.forEach(marker => {
        this.map.removeLayer(marker);
      });
      this.markers = [];
      this.saveMarkers();
    },
  }
}
</script>

<style>
#map {
  height: 500px;
}

@import "~leaflet/dist/leaflet.css";
</style>
