export class MapAdapter {
 constructor() {
  this.svService = new google.maps.StreetViewService();
 }

 createMap(element, { center = { lat: 0, lng: 0 }, zoom = 2 } = {}) {
  if (!element) throw new Error("Map container missing");

  return new google.maps.Map(element, {
   center,
   zoom,
   disableDefaultUI: true
  });
 }

 createMarker(map, { lat, lng }, options = {}) {
  const {
   color = "#ff4d4d",
   size = 20
  } = options;

  const radius = size === 30 ? 7 : 6;

  const svg =
  `<svg width="${size}" height="${size}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="${radius}" fill="${color}" opacity="0.9"/>
    <circle cx="10" cy="10" r="${radius + 3}" stroke="${color}" stroke-width="2" fill="none" opacity="0.4"/>
   </svg>`;

  return new google.maps.Marker({
   position: { lat, lng },
   map,
   icon: {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2)
   },
   optimized: false
  });
 }

 removeMarker(marker) {
  marker?.setMap(null);
 }

 createPolyline(map, path, options = {}) {
  const { color = "#ff4d4d" } = options;

  return new google.maps.Polyline({
   path,
   geodesic: true,
   strokeColor: color,
   strokeOpacity: 1,
   strokeWeight: 2,
   map
  });
 }

 fitToMarkers(map, markers) {
  const bounds = new google.maps.LatLngBounds();

  markers.forEach(m => {
   const pos = m.getPosition();
   if (pos) bounds.extend(pos);
  });

  map.fitBounds(bounds);
 }

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

 getStreetViewMeta({ lat, lng }) {
  return new Promise(resolve => {
   this.svService.getPanorama(
    { location: { lat, lng }, radius: 50000 },
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
