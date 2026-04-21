export class MapWrapperUI {
 constructor({ adapter, element, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;

  this.element = element;

  this.map = null;
  this.guessMarker = null;

  this.isLocked = false;
  this.onGuess = null;

  this.lastGuessPoint = null;
 }

init() {
  if (!this.element) return;

  // 🔥 обязательно дать size ready
  const rect = this.element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.warn("Map container not ready");
  }

this.map = this.adapter.createMap(this.element, {
  zoom: 2,
  center: { lat: 20, lng: 0 },
  disableDefaultUI: true,
  zoomControl: false,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  gestureHandling: "greedy" // можно двигать без UI
});

  this.map.addListener("click", (e) => {
    if (this.isLocked) return;

    const point = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    this.lastGuessPoint = point;
    this.placeGuessMarker(point);
  });

  // 🔥 force resize fix
  setTimeout(() => {
    google.maps.event.trigger(this.map, "resize");
  }, 50);

  this.initResize();
}

 // =========================
 // INPUT
 // =========================

 bindGuess(cb) {
  this.onGuess = cb;
 }

 bindGuessButton(el) {
  if (!el) return;

  el.addEventListener("click", () => {
   if (this.isLocked) return;
   if (!this.onGuess) return;
   if (!this.lastGuessPoint) return;

   this.onGuess(this.lastGuessPoint);
  });
 }

 // =========================
 // MARKER
 // =========================

 placeGuessMarker(point) {
  if (!this.map || !point) return;

  this.clearGuessMarker();

  const color =
   this.uiBuilder?.getPlayerColor?.("p1") ?? "#ff4d4d";

  this.guessMarker = this.adapter.createMarker(
   this.map,
   point,
   { color, size: 20 }
  );
 }

 clearGuessMarker() {
  if (!this.guessMarker) return;

  this.adapter.removeMarker(this.guessMarker);
  this.guessMarker = null;
 }

 // =========================
 // STATE
 // =========================

 reset() {
  this.unlock();
  this.clearGuessMarker();
  this.lastGuessPoint = null;
 }

 lock() {
  this.isLocked = true;
 }

 unlock() {
  this.isLocked = false;
 }

 // =========================
 // RESIZE
 // =========================

 initResize() {
  const handle = this.element
   ?.parentElement
   ?.querySelector(".resize-handle");

  if (!handle) return;

  let startX, startY, startW, startH;

  handle.addEventListener("mousedown", (e) => {
   e.preventDefault();

   const wrapper = this.element.parentElement;
   const rect = wrapper.getBoundingClientRect();

   startX = e.clientX;
   startY = e.clientY;
   startW = rect.width;
   startH = rect.height;

   document.body.style.userSelect = "none";

   const onMove = (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    wrapper.style.width = Math.max(200, startW + dx) + "px";
    wrapper.style.height = Math.max(200, startH - dy) + "px";

    this.adapter.triggerResize?.(this.map);
   };

   const onUp = () => {
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
   };

   window.addEventListener("mousemove", onMove);
   window.addEventListener("mouseup", onUp);
  });
 }
}
