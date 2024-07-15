<template>
  <div id="app">
    <div id="map"></div>
    <div class="button-container">
      <button @click="clearMarkers">Clear Markers</button>
      <button @click="addTestMarker">Add Test Marker</button>
    </div>
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
      markers: [],
      knownPoints: [
        { svg: [0, 0], gps: [11.106563, 106.612568] },
        { svg: [1000, 0], gps: [11.106751, 106.613055] },
        { svg: [1000, 1000], gps: [11.106231, 106.613248] },
        { svg: [0, 1000], gps: [11.106055, 106.612760] },
      ],
    };
  },
  mounted() {
    this.initMap();
    this.loadMarkers();
    this.getGeolocation();
    this.loadRasterizedSvg();
  },
  methods: {
    initMap() {
      this.map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 2, // Adjust as needed
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
            const svgCoordinates = this.transformToSvg(latitude, longitude);
            if (svgCoordinates) {
              this.map.setView(svgCoordinates, 13);
            } else {
              console.error('SVG coordinates transformation failed.');
            }
          },
          error => {
            console.error(error.message);
          }
        );
      }
    },
    addMarker(event) {
      const markerCoordinates = event.latlng;
      const gpsCoordinates = this.transformToGps(markerCoordinates.lat, markerCoordinates.lng);
      if (gpsCoordinates) {
        const popupContent = this.createPopupContent(markerCoordinates, gpsCoordinates);
        const marker = L.marker(markerCoordinates).addTo(this.map).bindPopup(popupContent);
        this.markers.push(marker);
        this.debouncedSaveMarkers();
      } else {
        console.error('GPS coordinates transformation failed.');
      }
    },
    createPopupContent(markerCoordinates, gpsCoordinates) {
      const gpsLat = gpsCoordinates[0].toFixed(6);
      const gpsLng = gpsCoordinates[1].toFixed(6);
      return `
        <b>SVG Coordinates:</b> ${markerCoordinates.lat.toFixed(2)}, ${markerCoordinates.lng.toFixed(2)}<br>
        <b>GPS Coordinates:</b> ${gpsLat}, ${gpsLng}
      `;
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
    transformToSvg(lat, lon) {
      const { knownPoints } = this;
      const [p1, p2, p3, p4] = knownPoints;

      const x = this.bilinearInterpolation(
        p1.gps[0], p2.gps[0], p3.gps[0], p4.gps[0],
        p1.svg[0], p2.svg[0], p3.svg[0], p4.svg[0],
        lat, lon
      );

      const y = this.bilinearInterpolation(
        p1.gps[1], p2.gps[1], p3.gps[1], p4.gps[1],
        p1.svg[1], p2.svg[1], p3.svg[1], p4.svg[1],
        lat, lon
      );

      return [x, y];
    },
    transformToGps(x, y) {
      const { knownPoints } = this;
      const [p1, p2, p3, p4] = knownPoints;

      const lat = this.bilinearInterpolation(
        p1.svg[0], p2.svg[0], p3.svg[0], p4.svg[0],
        p1.gps[0], p2.gps[0], p3.gps[0], p4.gps[0],
        x, y
      );

      const lon = this.bilinearInterpolation(
        p1.svg[1], p2.svg[1], p3.svg[1], p4.svg[1],
        p1.gps[1], p2.gps[1], p3.gps[1], p4.gps[1],
        x, y
      );

      return [lat, lon];
    },
    bilinearInterpolation(x1, x2, x3, x4, y1, y2, y3, y4, x, y) {
      const a0 = y1;
      const a1 = (y2 - y1) / (x2 - x1);
      const a2 = (y3 - y1) / (x3 - x1);
      const a3 = (y1 - y2 - y3 + y4) / ((x2 - x1) * (x3 - x1));

      return a0 + a1 * (x - x1) + a2 * (y - x1) + a3 * (x - x1) * (y - x1);
    },
    addTestMarker() {
      const testSvgCoordinates = [500, 500];
      const gpsCoordinates = this.transformToGps(testSvgCoordinates[0], testSvgCoordinates[1]);
      const popupContent = this.createPopupContent({ lat: testSvgCoordinates[0], lng: testSvgCoordinates[1] }, gpsCoordinates);
      const marker = L.marker(testSvgCoordinates).addTo(this.map).bindPopup(popupContent);
      this.markers.push(marker);
    }
  }
}
</script>

<style>
#map {
  height: 100vh;
  width: 100%;
  border: 2px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.marker {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.marker:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.button-container {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background-color: #0056b3;
}

.leaflet-control-zoom {
  top: 80px !important; /* Adjust the position to avoid overlap */
}

@import "~leaflet/dist/leaflet.css";
</style>