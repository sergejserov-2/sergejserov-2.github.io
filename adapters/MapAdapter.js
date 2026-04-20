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
   disableDefaultUI: true
  });
 }

 // =========================
 // MARKERS (LEGACY + SVG ICONS)
 // =========================

 createMarker(map, { lat, lng }, type = "guess") {
  return new google.maps.Marker({
   position: { lat, lng },
   map,
   icon: this._getIcon(type),
   optimized: false
  });
 }

 removeMarker(marker) {
  marker?.setMap(null);
 }

 // =========================
 // ICON SYSTEM
 // =========================

 _getIcon(type) {
  const config = this._getMarkerStyle(type);

  const svg = 
  `<svg width="${config.size}" height="${config.size}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="${config.radius}" fill="${config.color}" opacity="0.9"/>
    <circle cx="10" cy="10" r="${config.radius + 3}" stroke="${config.color}" stroke-width="2" fill="none" opacity="0.4"/>
  </svg>`
  ;

  return {
   url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
   scaledSize: new google.maps.Size(config.size, config.size),
   anchor: new google.maps.Point(config.size / 2, config.size / 2)
  };
 }

 _getMarkerStyle(type) {
  switch (type) {
   case "actual":
    return {
     color: "#9aa0a6",   // серый
     size: 30,           // 1.5x
     radius: 7
    };

   case "player":
   case "guess":
   default:
    return {
     color: "#ff4d4d",   // красный
     size: 20,           // 1x
     radius: 6
    };
  }
 }

 // =========================
 // LINES
 // =========================

 createPolyline(map, path, color = "#ff4d4d") {
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
 // VIEWPORT
 // =========================

 fitToMarkers(map, markers) {
  const bounds = new google.maps.LatLngBounds();

  markers.forEach(m => {
   const pos = m.getPosition();
   if (pos) bounds.extend(pos);
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

 // =========================
 // OPTIONAL HELPERS
 // =========================

 setMarkerColor(type, color) {
  // задел под мультиплеер
  return this._getIcon(type, color);
 }
}
