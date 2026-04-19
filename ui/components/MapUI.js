export class MapUI {
 constructor({ adapter, mapElement, overviewElement }) {
  this.adapter = adapter;
  this.mapElement = mapElement;
  this.overviewElement = overviewElement;

  this.map = null;
  this.overviewMap = null;

  this.guessMarker = null;
  this.overviewMarkers = [];
  this.overviewLines = [];

  this.isLocked = false;
  this.onGuess = null;
 }

 init() {
  if (!this.mapElement || !this.overviewElement) return;

  this.map = this.adapter.createMap(this.mapElement, { zoom: 2 });
  this.overviewMap = this.adapter.createMap(this.overviewElement, { zoom: 2 });

  this.map.addListener("click", (e) => {
   if (this.isLocked) return;

   const point = {
    lat: e.latLng.lat(),
    lng: e.latLng.lng()
   };

   this.placeGuessMarker(point);
   this.onGuess?.(point);
  });

  this.initResize();
 }

 bindGuess(callback) {
  this.onGuess = callback;
 }

 // =========================
 // RESIZE
 // =========================

initResize() {
 const handle = document.querySelector(".resize-handle");
 if (!handle) return;

 let startX, startY, startW, startH;

 handle.addEventListener("mousedown", (e) => {
  e.preventDefault();

  const wrapper = this.mapElement.parentElement;

  const rect = wrapper.getBoundingClientRect();

  startX = e.clientX;
  startY = e.clientY;

  startW = rect.width;
  startH = rect.height;

  const onMove = (e) => {
   const dx = e.clientX - startX;
   const dy = e.clientY - startY;

   const newWidth = Math.max(200, startW + dx);

   // ключ: invert Y, чтобы "низ был якорем"
   const newHeight = Math.max(200, startH - dy);

   wrapper.style.width = newWidth + "px";
   wrapper.style.height = newHeight + "px";

   // карта всегда заполняет контейнер
   this.mapElement.style.width = "100%";
   this.mapElement.style.height = "100%";

   // важно: чтобы Google Maps не глючил при ресайзе
   if (this.map && this.adapter?.triggerResize) {
    this.adapter.triggerResize(this.map);
   }

   if (this.overviewMap && this.adapter?.triggerResize) {
    this.adapter.triggerResize(this.overviewMap);
   }
  };

  const onUp = () => {
   window.removeEventListener("mousemove", onMove);
   window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
 });
}

 // =========================
 // MARKERS
 // =========================

 placeGuessMarker(point) {
  if (!this.map || !point) return;

  this.clearGuessMarker();
  this.guessMarker = this.adapter.createMarker(this.map, point);
 }

 clearGuessMarker() {
  if (!this.guessMarker) return;

  this.adapter.removeMarker(this.guessMarker);
  this.guessMarker = null;
 }

 reset() {
  this.unlock();
  this.clearGuessMarker();
  this.clearOverview();
 }

 lock() {
  this.isLocked = true;
 }

 unlock() {
  this.isLocked = false;
 }

 renderOverview(round) {
  if (!this.overviewMap) return;

  const guess = round.guesses?.[0]?.guess;
  const actual = round.actualLocation;

  if (!guess || !actual) return;

  this.clearOverview();

  const guessMarker = this.adapter.createMarker(this.overviewMap, guess);
  const actualMarker = this.adapter.createMarker(this.overviewMap, actual);

  const line = this.adapter.createPolyline(this.overviewMap, [
   guess,
   actual
  ]);

  this.adapter.fitToMarkers(this.overviewMap, [guessMarker, actualMarker]);

  this.overviewMarkers.push(guessMarker, actualMarker);
  this.overviewLines.push(line);
 }

 clearOverview() {
  this.overviewLines.forEach(l => l.setMap(null));
  this.overviewMarkers.forEach(m => this.adapter.removeMarker(m));

  this.overviewLines = [];
  this.overviewMarkers = [];
 }
}
