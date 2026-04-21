export class StreetViewAdapter {
 constructor() {
  this.svService = new google.maps.StreetViewService();
  this.moveListeners = [];
 }

 createStreetView(element, { lat = 0, lng = 0 } = {}) {
  if (!element) throw new Error("StreetView container missing");

  const panorama = new google.maps.StreetViewPanorama(element, {
   position: { lat, lng },
   pov: { heading: 0, pitch: 0 },

   addressControl: false,
   showRoadLabels: false,
   fullscreenControl: false,
   zoomControl: true,
   disableDefaultUI: false,
   compassControl: true
  });

  return panorama;
 }

 // =========================
 // READY SIGNAL
 // =========================
 attachReadySignal(panorama, cb) {
  if (!panorama) return;

  let resolved = false;

  const resolve = () => {
   if (resolved) return;
   resolved = true;
   cb?.();
  };

  const idleListener = panorama.addListener("idle", resolve);

  setTimeout(resolve, 600);

  setTimeout(() => {
   google.maps.event.removeListener(idleListener);
  }, 1000);
 }

 // =========================
 // MOVES (ШАГИ)
 // =========================

 onMove(cb) {
  this.moveListeners.push(cb);
 }

 initMoveTracking(panorama) {
  if (!panorama) return;

  let lastPos = null;
  let locked = false;

  panorama.addListener("position_changed", () => {
   const pos = panorama.getPosition?.();
   if (!pos) return;

   const current = {
    lat: pos.lat(),
    lng: pos.lng()
   };

   if (!lastPos) {
    lastPos = current;
    return;
   }

   const moved =
    current.lat !== lastPos.lat ||
    current.lng !== lastPos.lng;

   if (!moved) return;

   lastPos = current;

   if (locked) return;

   this.moveListeners.forEach(cb => cb(current));
  });
 }

 // =========================
 // META
 // =========================
 async getStreetViewMeta({ lat, lng }) {
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
