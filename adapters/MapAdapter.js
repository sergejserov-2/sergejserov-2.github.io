export class MapAdapter {
 constructor() {
  this.maps = google.maps;
 }

 // =========================
 // MAP
 // =========================

 createMap(element, options = {}) {
  return new this.maps.Map(element, {
   center: { lat: 0, lng: 0 },
   zoom: options.zoom ?? 2,
   ...options
  });
 }

 triggerResize(map) {
  if (!map) return;
  this.maps.event.trigger(map, "resize");
 }

 // =========================
 // MARKERS (LEGACY + ADVANCED)
 // =========================

 createMarker(map, { lat, lng }) {
  const position = { lat, lng };

  // =========================
  // NEW API (AdvancedMarker)
  // =========================
  if (this.maps.marker?.AdvancedMarkerElement) {
   const el = document.createElement("div");

   el.style.width = "12px";
   el.style.height = "12px";
   el.style.background = "#ff4d4d";
   el.style.borderRadius = "50%";
   el.style.boxShadow = "0 0 10px rgba(255,0,0,0.6)";

   return new this.maps.marker.AdvancedMarkerElement({
    map,
    position,
    content: el
   });
  }

  // =========================
  // FALLBACK (old Marker)
  // =========================
  return new this.maps.Marker({
   map,
   position
  });
 }

 removeMarker(marker) {
  if (!marker) return;

  // legacy Marker
  if (marker.setMap) {
   marker.setMap(null);
   return;
  }

  // AdvancedMarkerElement
  marker.map = null;
 }

 // =========================
 // POLYLINE
 // =========================

 createPolyline(map, path) {
  return new this.maps.Polyline({
   map,
   path,
   strokeColor: "#4ea1ff",
   strokeOpacity: 1,
   strokeWeight: 3
  });
 }

 // =========================
 // FIT BOUNDS
 // =========================

 fitToMarkers(map, markers) {
  const bounds = new this.maps.LatLngBounds();

  markers.forEach(m => {
   let pos = null;

   // legacy Marker
   if (m.getPosition) {
    pos = m.getPosition();
   }

   // AdvancedMarkerElement
   if (!pos && m.position) {
    pos = m.position;
   }

   if (!pos) return;

   const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
   const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;

   if (lat != null && lng != null) {
    bounds.extend({ lat, lng });
   }
  });

  map.fitBounds(bounds);
 }
}
