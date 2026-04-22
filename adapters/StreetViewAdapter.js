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


async getStreetViewMeta({ lat, lng }) {
  return new Promise(resolve => {
    this.svService.getPanorama(
      {
        location: { lat, lng },
        radius: 50000
      },
      (data, status) => {

        const validBase =
          status === "OK" &&
          data?.location &&
          data?.location?.latLng;

        if (!validBase) {
          return resolve({
            valid: false,
            reason: "no_panorama",
            location: null
          });
        }

        const links = data.links || [];

        // =========================
        // 🔥 FILTER 1: NO MOVEMENT
        // =========================
        const hasNavigation = links.length > 0;

        // =========================
        // 🔥 FILTER 2: INDOOR DETECTION
        // =========================
        const desc = (data?.location?.description || "").toLowerCase();

        const isIndoor =
          desc.includes("indoor") ||
          desc.includes("inside") ||
          desc.includes("museum") ||
          desc.includes("shop") ||
          desc.includes("store");

        // =========================
        // FINAL DECISION
        // =========================
        if (!hasNavigation) {
          return resolve({
            valid: false,
            reason: "no_navigation",
            location: null
          });
        }

        if (isIndoor) {
          return resolve({
            valid: false,
            reason: "indoor",
            location: null
          });
        }

        resolve({
          valid: true,
          location: {
            lat: data.location.latLng.lat(),
            lng: data.location.latLng.lng()
          }
        });
      }
    );
  });
}
}
