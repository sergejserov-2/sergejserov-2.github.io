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

 createMarker(map, { lat, lng }) {
  return new google.maps.Marker({
   position: { lat, lng },
   map
  });
 }

 removeMarker(marker) {
  marker?.setMap(null);
 }

 createPolyline(map, path) {
  return new google.maps.Polyline({
   path,
   geodesic: true,
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
    {
     location: { lat, lng },
     radius: 20000
    },
    (data, status) => {
     const valid =
      status === "OK" &&
      data?.location &&
      data?.location?.latLng;

     if (!valid) {
      console.warn("StreetView meta fail:", status);
     }

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

 async ensureReady() {
  return new Promise(resolve => {
   const check = () => {
    if (window.google?.maps?.StreetViewService) {
     resolve();
    } else {
     setTimeout(check, 50);
    }
   };
   check();
  });
 }
}
