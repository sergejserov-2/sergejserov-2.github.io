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
 }

 bindGuess(callback) {
  this.onGuess = callback;
 }

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

 lock() {
  this.isLocked = true;
 }

 unlock() {
  this.isLocked = false;
 }

 reset() {
  this.unlock();
  this.clearGuessMarker();
  this.clearOverview();
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
