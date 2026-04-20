export class MapOverviewUI {
 constructor({ adapter, overviewElement, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;

  this.overviewElement = overviewElement;

  this.map = null;

  this.markers = [];
  this.lines = [];
 }

 init() {
  if (!this.overviewElement) return;

  this.map = this.adapter.createMap(this.overviewElement, { zoom: 2 });
 }

 render(round) {
  if (!this.map) return;

  const guessObj = round?.guesses?.[0];
  const guess = guessObj?.guess;
  const actual = round?.actualLocation;

  if (!guess || !actual) return;

  this.clear();

  const playerId = guessObj?.playerId || "p1";

  const playerColor =
   this.uiBuilder?.getPlayerColor?.(playerId) ?? "#ff4d4d";

  const actualColor =
   this.uiBuilder?.getActualColor?.() ?? "#9aa0a6";

  const guessMarker = this.adapter.createMarker(
   this.map,
   guess,
   { color: playerColor, size: 20 }
  );

  const actualMarker = this.adapter.createMarker(
   this.map,
   actual,
   { color: actualColor, size: 30 }
  );

  const line = this.adapter.createPolyline(
   this.map,
   [guess, actual],
   { color: playerColor }
  );

  this.adapter.fitToMarkers(this.map, [
   guessMarker,
   actualMarker
  ]);

  this.markers.push(guessMarker, actualMarker);
  this.lines.push(line);

  setTimeout(() => {
   google.maps.event.trigger(this.map, "resize");
  }, 100);
 }

 clear() {
  this.lines.forEach(l => l.setMap(null));
  this.markers.forEach(m => this.adapter.removeMarker(m));

  this.lines = [];
  this.markers = [];
 }
}
