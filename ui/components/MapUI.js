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

 init() {
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

 placeGuessMarker(point) {
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
  this.adapter.removeMarker(this.guessMarker);
  this.guessMarker = null;
 }

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

 renderOverview(round) {
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
 }

 clearOverview() {
  this.overviewLines.forEach(l => l.setMap(null));
  this.overviewMarkers.forEach(m => this.adapter.removeMarker(m));

  this.overviewLines = [];
  this.overviewMarkers = [];
 }
}
