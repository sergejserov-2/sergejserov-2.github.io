
export class MapUI {
 constructor({ adapter, mapElement, overviewElement, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;

  this.mapElement = mapElement;
  this.overviewElement = overviewElement;

  this.map = null;
  this.overviewMap = null;

  this.guessMarker = null;
  this.overviewMarkers = [];
  this.overviewLines = [];

  this.isLocked = false;
  this.onGuess = null;

  this.lastGuessPoint = null;
 }

 // =========================
 // INIT
 // =========================

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

   this.lastGuessPoint = point;
   this.placeGuessMarker(point);
  });

  this.initResize();
 }

 // =========================
 // BIND
 // =========================

 bindGuess(callback) {
  this.onGuess = callback;
 }

 bindGuessButton(element) {
  if (!element) return;

  element.addEventListener("click", () => {
   if (this.isLocked) return;
   if (!this.onGuess) return;
   if (!this.lastGuessPoint) return;

   this.onGuess(this.lastGuessPoint);
  });
 }

 // =========================
 // MARKERS (GAME MAP)
 // =========================

 placeGuessMarker(point) {
  if (!this.map || !point) return;

  this.clearGuessMarker();

  this.guessMarker = this.adapter.createMarker(
   this.map,
   point,
   {
    color: this.uiBuilder.getPlayerColor("p1"),
    size: 20
   }
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
  this.clearOverview();
  this.lastGuessPoint = null;
 }

 lock() {
  this.isLocked = true;
 }

 unlock() {
  this.isLocked = false;
 }

 // =========================
 // OVERVIEW
 // =========================

 renderOverview(round) {
  if (!this.overviewMap) return;

  const guessObj = round?.guesses?.[0];
  const guess = guessObj?.guess;
  const actual = round?.actualLocation;

  if (!guess || !actual) return;

  this.clearOverview();

  const playerId = guessObj?.playerId || "p1";

  const guessMarker = this.adapter.createMarker(
   this.overviewMap,
   guess,
   {
    color: this.uiBuilder.getPlayerColor(playerId),
    size: 20
   }
  );

  const actualMarker = this.adapter.createMarker(
   this.overviewMap,
   actual,
   {
    color: this.uiBuilder.getActualColor(),
    size: 30
   }
  );

  const line = this.adapter.createPolyline(
   this.overviewMap,
   [guess, actual],
   {
    color: this.uiBuilder.getPlayerColor(playerId)
   }
  );

  this.adapter.fitToMarkers(this.overviewMap, [
   guessMarker,
   actualMarker
  ]);

  this.overviewMarkers.push(guessMarker, actualMarker);
  this.overviewLines.push(line);

  setTimeout(() => {
   google.maps.event.trigger(this.overviewMap, "resize");
  }, 100);
 }

 // =========================
 // CLEANUP
 // =========================

 clearOverview() {
  this.overviewLines.forEach(l => l.setMap(null));
  this.overviewMarkers.forEach(m => this.adapter.removeMarker(m));

  this.overviewLines = [];
  this.overviewMarkers = [];
 }

 refreshOverview() {
  if (!this.overviewMap) return;
  google.maps.event.trigger(this.overviewMap, "resize");
 }

 // =========================
 // RESIZE
 // =========================

 initResize() {
  const handle = this.mapElement
   ?.parentElement
   ?.querySelector(".resize-handle");

  if (!handle) return;

  let startX, startY, startW, startH;

  handle.addEventListener("mousedown", (e) => {
   e.preventDefault();

   const wrapper = this.mapElement.parentElement;
   const rect = wrapper.getBoundingClientRect();

   startX = e.clientX;
   startY = e.clientY;
   sta

rtW = rect.width;
   startH = rect.height;

   const onMove = (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    wrapper.style.width = Math.max(200, startW + dx) + "px";
    wrapper.style.height = Math.max(200, startH - dy) + "px";

    this.adapter.triggerResize?.(this.map);
   };

   const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
   };

   window.addEventListener("mousemove", onMove);
   window.addEventListener("mouseup", onUp);
  });
 }
}



