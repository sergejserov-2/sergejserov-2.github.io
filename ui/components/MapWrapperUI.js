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

  this.area = null;
  this.polygon = null;
  this.polygonVisible = false;
 }

 // =========================
 // INIT
 // =========================
 init() {
  if (!this.element) return;

  this.map = this.adapter.createMap(this.element, {
   zoom: 2,
   center: { lat: 20, lng: 0 }
  });

  this.scheduleResize();

  // =========================
  // MAPLIBRE CLICK FIX
  // =========================
  this.map.on("click", (e) => {
   if (this.isLocked) return;

   const point = {
    lat: e.lngLat.lat,
    lng: e.lngLat.lng
   };

   this.lastGuessPoint = point;
   this.placeGuessMarker(point);
  });

  this.initResize();
 }

 // =========================
 // POLYGON
 // =========================
 setArea(area) {
  this.area = area;
 }

 togglePolygon() {
  if (!this.map || !this.area) return;

  if (this.polygonVisible) {
   this.polygon?.remove?.();
   this.polygon = null;
   this.polygonVisible = false;
   return;
  }

  this.polygon = this.adapter.createPolygon(
   this.map,
   this.area.polygon,
   {
    strokeColor: "#4ea1ff",
    fillColor: "#4ea1ff"
   }
  );

  this.polygonVisible = true;
 }

 bindPolygonButton(el) {
  if (!el) return;

  el.addEventListener("click", () => this.togglePolygon());
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
   { color, scale: 1 }
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

  if (this.polygon) {
   this.polygon.remove?.();
   this.polygon = null;
   this.polygonVisible = false;
  }
 }

 lock() {
  this.isLocked = true;
 }

 unlock() {
  this.isLocked = false;
 }

 // =========================
 // RESIZE (MapLibre)
 // =========================
 scheduleResize() {
  if (!this.map) return;

  requestAnimationFrame(() => {
   this.map.resize();
  });
 }

 // =========================
 // DOM RESIZE HANDLER
 // =========================
initResize() {
 const handle =
  this.element?.parentElement?.querySelector(".resize-handle");

 if (!handle) return;

 let startX, startY, startW, startH;
 let raf = null;

 const schedule = () => {
  if (raf) return;

  raf = requestAnimationFrame(() => {
   this.map?.resize?.();
   raf = null;
  });
 };

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

   // 🔥 НЕ ДЕРГАЕМ КАРТУ КАЖДЫЙ PIXEL
   schedule();
  };

  const onUp = () => {
   document.body.style.userSelect = "";

   window.removeEventListener("mousemove", onMove);
   window.removeEventListener("mouseup", onUp);

   // 🔥 ФИНАЛЬНЫЙ resize (самый важный)
   requestAnimationFrame(() => {
    this.map?.resize?.();
   });
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
 });
}
}
