export class MapWrapperUI {
 constructor({ adapter, element, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;
  this.element = element;

  this.map = null;
  this.guessMarker = null;
  this.lastGuessPoint = null;
  this.isLocked = false;

  this._resizeObserver = null;
 }

 init() {
  this.map = this.adapter.createMap(this.element, {
   zoom: 2,
   center: { lat: 20, lng: 0 }
  });

  // 🔥 стабильный resize
  this._resizeObserver = new ResizeObserver(() => {
   this.adapter.resize(this.map);
  });

  this._resizeObserver.observe(this.element);

  this.map.on("click", (e) => {
   if (this.isLocked) return;

   const point = {
    lat: e.lngLat.lat,
    lng: e.lngLat.lng
   };

   this.lastGuessPoint = point;
   this.placeGuessMarker(point);
  });
 }

 placeGuessMarker(point) {
  this.clearGuessMarker();

  this.guessMarker = this.adapter.createMarker(
   this.map,
   point,
   {
    color: this.uiBuilder.getPlayerColor("p1")
   }
  );
 }

 clearGuessMarker() {
  if (!this.guessMarker) return;

  this.adapter.removeMarker(this.guessMarker);
  this.guessMarker = null;
 }

 reset() {
  this.clearGuessMarker();
  this.lastGuessPoint = null;
  this.unlock();
 }

 lock() {
  this.isLocked = true;
 }

 unlock() {
  this.isLocked = false;
 }
}
