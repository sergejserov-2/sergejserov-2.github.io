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

  this.map = this.adapter.createMap(this.overviewElement, {
   zoom: 2
  });
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

  // 🌈 ГРАДИЕНТНАЯ ЛИНИЯ
  const segments = this.adapter.createGradientPolyline(
   this.map,
   [guess, actual],
   playerColor,
   actualColor,
   12
  );

fitToMarkers(map, markers, padding = 80) {
 const bounds = new google.maps.LatLngBounds();

 markers.forEach(m => {
  const pos = m.getPosition();
  if (pos) bounds.extend(pos);
 });

 map.fitBounds(bounds, padding);

 const listener = google.maps.event.addListenerOnce(map, "idle", () => {
  const zoom = map.getZoom();
  if (zoom > 4) map.setZoom(4);
  google.maps.event.removeListener(listener);
 });
}

  this.markers.push(guessMarker, actualMarker);
  this.lines.push(...segments);

  setTimeout(() => {
   google.maps.event.trigger(this.map, "resize");
  }, 100);
 }

 clear() {
  this.markers.forEach(m =>
   this.adapter.removeMarker(m)
  );

  this.lines.forEach(l => l.setMap(null));

  this.markers = [];
  this.lines = [];
 }
}
