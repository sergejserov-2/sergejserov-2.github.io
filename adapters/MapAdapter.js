export class MapOverviewUI {
 constructor({ adapter, element, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;

  this.element = element;

  this.map = null;

  this.markers = [];
  this.lines = [];
 }

 // =========================
 // INIT
 // =========================

 init() {
  if (!this.element) return;

  this.map = this.adapter.createMap(this.element, {
   zoom: 2
  });
 }

 // =========================
 // RENDER ROUND
 // =========================

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

  // =========================
  // MARKERS
  // =========================

  const guessMarker = this.adapter.createMarker(
   this.map,
   guess,
   {
    color: playerColor,
    size: 20
   }
  );

  const actualMarker = this.adapter.createMarker(
   this.map,
   actual,
   {
    color: actualColor,
    size: 30
   }
  );

  // =========================
  // LINE
  // =========================

  const line = this.adapter.createPolyline(
   this.map,
   [guess, actual],
   {
    color: playerColor
   }
  );

  // =========================
  // CAMERA (НОВАЯ ЛОГИКА ВНУТРИ UI)
  // =========================

  this.fitToPoints([guess, actual]);

  this.markers.push(guessMarker, actualMarker);
  this.lines.push(line);

  setTimeout(() => {
   google.maps.event.trigger(this.map, "resize");
  }, 100);
 }

 // =========================
 // CAMERA LOGIC (NO GOOGLE API COUPLING)
 // =========================

 fitToPoints(points) {
  if (!this.map || !points?.length) return;
  if (points.length < 2) return;

  const [a, b] = points;

  const center = {
   lat: (a.lat + b.lat) / 2,
   lng: (a.lng + b.lng) / 2
  };

  const distance = this._distance(a, b);

  let zoom = 4;

  if (distance < 10) zoom = 6;
  else if (distance < 50) zoom = 5;
  else if (distance < 200) zoom = 4;
  else if (distance < 1000) zoom = 3;
  else zoom = 2;

  this.map.setCenter(center);
  this.map.setZoom(zoom);
 }

 // =========================
 // DISTANCE (PURE)
 // =========================

 _distance(a, b) {
  const R = 6371;

  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;

  const x =
   Math.sin(dLat / 2) ** 2 +
   Math.cos(a.lat * Math.PI / 180) *
   Math.cos(b.lat * Math.PI / 180) *
   Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
 }

 // =========================
 // CLEAR
 // =========================

 clear() {
  this.markers.forEach(m => this.adapter.removeMarker(m));
  this.lines.forEach(l => l.setMap(null));

  this.markers = [];
  this.lines = [];
 }

 // =========================
 // MULTIPLAYER HOOK
 // =========================

 addPlayerResult({ guess, actual, playerId }) {
  const color =
   this.uiBuilder?.getPlayerColor?.(playerId) ?? "#ff4d4d";

  const guessMarker = this.adapter.createMarker(
   this.map,
   guess,
   { color, size: 20 }
  );

  const actualMarker = this.adapter.createMarker(
   this.map,
   actual,
   { color: "#9aa0a6", size: 30 }
  );

  const line = this.adapter.createPolyline(
   this.map,
   [guess, actual],
   { color }
  );

  this.markers.push(guessMarker, actualMarker);
  this.lines.push(line);
 }
}
