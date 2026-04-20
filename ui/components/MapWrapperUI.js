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

  this.map = this.adapter.createMap(this.element, { zoom: 2 });

  this.map.addListener("click", (e) => {
   if (this.isLocked) return;

   const point = {
    lat: e.latLng.lat(),
    lng: e.latLng.lng()
   };

   this.lastGuessPoint = point;
   this.placeGuessMarker(point);
  });

  this.initResize?.();
 }

 bindGuess(cb) {
  this.onGuess = cb;
 }

 bindGuessButton(btn) {
  if (!btn) return;

  btn.addEventListener("click", () => {
   if (this.isLocked) return;
   if (!this.onGuess) return;
   if (!this.lastGuessPoint) return;

   this.onGuess(this.lastGuessPoint);
  });
 }

 placeGuessMarker(point) {
  if (!this.map) return;

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

 lock() { this.isLocked = true; }
 unlock() { this.isLocked = false; }

 reset() {
  this.unlock();
  this.clearGuessMarker();
  this.lastGuessPoint = null;
 }

 // resize можно оставить тут (или вынести позже)
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
