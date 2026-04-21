export class StreetViewAdapter {
 constructor() {
  this.svService = new google.maps.StreetViewService();
 }

 createStreetView(element, { lat = 0, lng = 0 } = {}) {
  if (!element) throw new Error("StreetView container missing");

  return new google.maps.StreetViewPanorama(element, {
   position: { lat, lng },
   pov: { heading: 0, pitch: 0 },

   addressControl: false,
   showRoadLabels: false,
   fullscreenControl: false,
   zoomControl: true,
   disableDefaultUI: false,
   compassControl: true
  });
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

  // 🔥 основной сигнал Google
  const idleListener = panorama.addListener("idle", resolve);

  // 🔥 страховка 1 (быстрая готовность)
  setTimeout(resolve, 600);

  // 🔥 очистка listener (чуть позже, чтобы не убить событие раньше времени)
  setTimeout(() => {
   google.maps.event.removeListener(idleListener);
  }, 1000);
 }

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
