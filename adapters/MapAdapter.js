export class MapAdapter {
 constructor() {
  this.svService = new google.maps.StreetViewService();
 }

 // =========================
 // MAP
 // =========================

 createMap(element, { center = { lat: 0, lng: 0 }, zoom = 2 } = {}) {
  if (!element) throw new Error("Map container missing");

  return new google.maps.Map(element, {
   center,
   zoom,
   disableDefaultUI: true,
   mapID: "DEMO_MAP_ID"
  });
 }

 // =========================
 // MARKERS (ONLY ADVANCED MARKERS)
 // =========================

 createMarker(map, { lat, lng }, type = "guess") {
  const position = { lat, lng };

  const content = this._createMarkerElement(type);

  const marker = new google.maps.marker.AdvancedMarkerElement({
   map,
   position,
   content
  });

  this._animateMarker(content);

  return marker;
 }

 // =========================
 // VISUAL MARKERS
 // =========================

_createMarkerElement(type) {
 const el = document.createElement("div");

 el.style.borderRadius = "50%";
 el.style.transform = "scale(0)";
 el.style.transition = "transform 0.2s ease-out";

 el.style.pointerEvents = "auto";
 el.style.cursor = "pointer";

 if (type === "guess") {
  el.style.width = "12px";
  el.style.height = "12px";
  el.style.background = "#ff4d4d";
  el.style.boxShadow = "0 0 10px rgba(255,77,77,0.6)";
 }

 if (type === "actual") {
  el.style.width = "18px";
  el.style.height = "18px";
  el.style.background = "#9aa0a6";
  el.style.boxShadow = "0 0 10px rgba(154,160,166,0.6)";
 }

 return el;
}

 // =========================
 // ANIMATION
 // =========================

 _animateMarker(el) {
  requestAnimationFrame(() => {
   el.style.transform = "scale(1)";
  });
 }

 // =========================
 // REMOVE MARKER
 // =========================

 removeMarker(marker) {
  if (!marker) return;

  // AdvancedMarkerElement cleanup
  marker.map = null;
 }

 // =========================
 // POLYLINE
 // =========================

 createPolyline(map, path, { color = "#ff4d4d" } = {}) {
  return new google.maps.Polyline({
   path,
   geodesic: true,
   strokeColor: color,
   strokeOpacity: 1,
   strokeWeight: 2,
   map
  });
 }

 // =========================
 // FIT BOUNDS
 // =========================

 fitToMarkers(map, markers) {
  const bounds = new google.maps.LatLngBounds();

  markers.forEach(m => {
   if (!m) return;

   let pos = null;

   if (m.position) {
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

 // =========================
 // STREET VIEW
 // =========================

 createStreetView(element, { lat = 0, lng = 0 }) {
  if (!element) throw new Error("StreetView container missing");

  return new google.maps.StreetViewPanorama(element, {
   position: { lat, lng },
   pov: { heading: 0, pitch: 0 },
   addressControl: false,
   showRoadLabels: false,
   fullscreenControl: false,
   zoomControl: true,
   disableDefaultUI: true
  });
 }

 // =========================
 // STREET VIEW META
 // =========================

 getStreetViewMeta({ lat, lng }) {
  return new Promise(resolve => {
   this.svService.getPanorama(
    {
     location: { lat, lng },
     radius: 50000
    },
    (data, status) => {
     const valid =
      status === "OK" &&
      data?.location &&
      data?.location?.latLng;

     resolve({
      valid,
      location: valid
       ? {
          lat: data.location.latLng.lat(),
          lng: data.location.latLng.lng()
         }
       : null
     });
    }
   );
  });
 }
}
