import { Geometry } from "../../domain/math/Geometry.js";

export class MapOverviewUI {
 constructor({ adapter, element, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;
  this.element = element;

  this.map = null;
  this.markers = [];
  this.line = null;

  this._resizeObserver = null;
 }

 // =========================
 // INIT
 // =========================
 init() {
  if (!this.element) return;

  this.map = this.adapter.createMap(this.element, {
   center: { lat: 20, lng: 0 },
   zoom: 2
  });

  this._resizeObserver = new ResizeObserver(() => {
   this.forceResize();
  });

  this._resizeObserver.observe(this.element);
 }

 // =========================
 // RENDER
 // =========================
 render(round) {
  if (!this.map || !round) return;

  this.clear();

  const actual = round.actualLocation;
  const guess = round.guess;

  if (!actual) return;

  const playerColor = this.uiBuilder.getPlayerColor(
   guess?.playerId || "p1"
  );

  const actualColor = this.uiBuilder.getActualColor();

  // =========================
  // NO GUESS CASE
  // =========================
  if (!guess) {
   const m = this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.35
   });

   this.markers.push(m);

   this.adapter.setCenter(this.map, actual);
   this.adapter.setZoom(this.map, 4);

   return;
  }

  // =========================
  // MARKERS
  // =========================
  const guessMarker = this.adapter.createMarker(this.map, guess, {
   color: playerColor,
   scale: 1
  });

  const actualMarker = this.adapter.createMarker(this.map, actual, {
   color: actualColor,
   scale: 1.35
  });

  this.markers.push(guessMarker, actualMarker);

  // =========================
  // FIT BOUNDS FIRST
  // =========================
  this.fitToPoints([guess, actual]);

  // =========================
  // SINGLE ANIMATED GRADIENT LINE
  // =========================
  this.line = this.adapter.createGradientPolyline(
   this.map,
   [guess, actual],
   playerColor,
   actualColor
  );
 }

 // =========================
 // FIT CAMERA
 // =========================
 fitToPoints(points) {
  const a = points[0];
  const b = points[1];

  const center = {
   lat: (a.lat + b.lat) / 2,
   lng: (a.lng + b.lng) / 2
  };

  const distance = Geometry.distance(a, b);

  let zoom = 5;
  if (distance < 10) zoom = 7;
  else if (distance < 50) zoom = 6;
  else if (distance < 200) zoom = 5;
  else if (distance < 1000) zoom = 4;
  else zoom = 3;

  this.adapter.setCenter(this.map, center);
  this.adapter.setZoom(this.map, zoom);
 }

 // =========================
 // CLEAR
 // =========================
 clear() {
  this.markers.forEach(m => this.adapter.removeMarker(m));
  this.markers = [];

  if (this.line) {
   this.line.remove?.();
   this.line = null;
  }
 }

 // =========================
 // RESIZE
 // =========================
 forceResize() {
  if (!this.map) return;
  this.map.resize();
 }

 // =========================
 // DESTROY
 // =========================
 destroy() {
  if (this._resizeObserver) {
   this._resizeObserver.disconnect();
   this._resizeObserver = null;
  }
 }
}
