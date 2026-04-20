export class StreetViewAdapter {

 create(element, position = { lat: 0, lng: 0 }) {
  if (!window.google?.maps?.StreetViewPanorama) {
   throw new Error("Google Maps not loaded");
  }

  if (!element) {
   throw new Error("StreetView container missing");
  }

  return new google.maps.StreetViewPanorama(element, {
   position,
   pov: { heading: 0, pitch: 0 },
   zoom: 1,
   disableDefaultUI: true,
   addressControl: false,
   showRoadLabels: false,
   fullscreenControl: false,
   zoomControl: true,
   linksControl: false,
   clickToGo: true,
   scrollwheel: true
  });
 }

 setPosition(panorama, pos) {
  if (!panorama || !pos) return;
  panorama.setPosition(pos);
 }

 setPov(panorama, pov) {
  if (!panorama || !pov) return;
  panorama.setPov(pov);
 }
}
