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
  // NO GUESS
  // =========================
  if (!guess) {
   this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.35
   });

   this.map.setCenter(actual);
   this.map.setZoom(4);

   return;
  }

  // =========================
  // CAMERA (ОДИН РАЗ, БЕЗ АНИМАЦИИ)
  // =========================
  this.fitToPoints([guess, actual]);

  // =========================
  // GUESS MARKER
  // =========================
  const guessMarker = this.adapter.createMarker(this.map, guess, {
   color: playerColor,
   scale: 1
  });

  this.markers.push(guessMarker);

  // =========================
  // SEGMENTS
  // =========================
  const segments = this.adapter.createGradientPolyline(
   null,
   [guess, actual],
   playerColor,
   actualColor,
   14
  );

  this.lines.push(...segments);

  // =========================
  // ANIMATE ONLY VISUALS
  // =========================
  this.animateSegments(segments, () => {
   const actualMarker = this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.35
   });

   this.markers.push(actualMarker);
  });
 }

 // =========================
 // CAMERA FIT (STATIC)
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
 // SEGMENT ANIMATION
 // =========================
 animateSegments(segments, onComplete) {
  if (!segments?.length) {
   onComplete?.();
   return;
  }

  let i = 0;

  const step = () => {
   if (i >= segments.length) {
    onComplete?.();
    return;
   }

   segments[i].setMap(this.map);
   i++;

   setTimeout(step, 20);
  };

  step();
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
 // RESIZE
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

 destroy() {
  if (this._resizeObserver) {
   this._resizeObserver.disconnect();
   this._resizeObserver = null;
  }
 }
}
