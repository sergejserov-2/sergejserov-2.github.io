import { Geometry } from "../../domain/math/Geometry.js";

export class MapOverviewUI {
 constructor({ adapter, element, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;
  this.element = element;

  this.map = null;
  this.markers = [];
  this.lines = [];

  this._resizeObserver = null;
  this._resizeRAF = null;
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

  // 🔥 правильное отслеживание размера контейнера
  this._resizeObserver = new ResizeObserver(() => {
   this.scheduleResize();
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
   const actualMarker = this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.35
   });

   this.markers.push(actualMarker);

   this.fitToPoints([actual, actual]);
   return;
  }

  // =========================
  // GUESS CASE
  // =========================

  const guessMarker = this.adapter.createMarker(this.map, guess, {
   color: playerColor,
   scale: 1
  });

  this.markers.push(guessMarker);

  const segments = this.adapter.createGradientPolyline(
   null,
   [guess, actual],
   playerColor,
   actualColor,
   14
  );

  this.lines.push(...segments);

  this.fitToPoints([guess, actual]);

  this.animateSegments(segments, () => {
   const actualMarker = this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.35
   });

   this.markers.push(actualMarker);
  });
 }

 // =========================
 // SEGMENT ANIMATION
 // =========================
 animateSegments(segments, onComplete) {
  if (!segments?.length) {
   onComplete?.();
   return;
  }

  let index = 0;
  const delay = Math.max(10, 200 / segments.length);

  const showNext = () => {
   if (index >= segments.length) {
    onComplete?.();
    return;
   }

   const segment = segments[index];
   segment.setMap(this.map);

   index++;
   setTimeout(showNext, delay);
  };

  showNext();
 }

 // =========================
 // FIT MAP
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

  this.map.setCenter(center);
  this.map.setZoom(zoom);
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
 // RESIZE SYSTEM (🔥 FIXED)
 // =========================
 scheduleResize() {
  if (!this.map) return;

  if (this._resizeRAF) {
   cancelAnimationFrame(this._resizeRAF);
  }

  this._resizeRAF = requestAnimationFrame(() => {
   google.maps.event.trigger(this.map, "resize");
   this._resizeRAF = null;
  });
 }

 forceResize() {
  this.scheduleResize();
 }

 // =========================
 // CLEANUP (если понадобится)
 // =========================
 destroy() {
  if (this._resizeObserver) {
   this._resizeObserver.disconnect();
   this._resizeObserver = null;
  }
 }
}
