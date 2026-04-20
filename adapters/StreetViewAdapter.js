export class StreetViewAdapter {

 create(element, position = { lat: 0, lng: 0 }) {
  if (!window.google?.maps) {
   throw new Error("Google Maps not loaded");
  }

  return new google.maps.StreetViewPanorama(element, {
   position,
   pov: { heading: 0, pitch: 0 },
   zoom: 1,
   disableDefaultUI: true,
   clickToGo: true
  });
 }

 setPosition(panorama, pos) {
  panorama.setPosition(pos);
 }

 setPov(panorama, pov) {
  panorama.setPov(pov);
 }
}
