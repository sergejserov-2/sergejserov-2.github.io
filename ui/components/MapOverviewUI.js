
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
  // NO GUESS STATE
  // =========================
  if (!guess) {
   this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.35
   });

   this.adapter.setCenter(this.map, actual);
   this.adapter.setZoom(this.map, 4);

   return;
  }

  // =========================
  // MARKERS
  // =========================
  this.markers.push(
   this.adapter.createMarker(this.map, guess, {
    color: playerColor,
    scale: 1
   })
  );

  // =========================
  // FIT BOUNDS (КРИТИЧЕСКИЙ ФИКС)
  // =========================
  requestAnimationFrame(() => {
   this.adapter.fitBounds(this.map, [guess, actual]);
  });

  // =========================
  // LINE SEGMENTS
  // =========================
  const segments = this.adapter.createGradientPolyline(
   this.map,
   [guess, actual],
   playerColor,
   actualColor,
   14
  );

  this.lines.push(...segments);

  // =========================
  // ANIMATION (only visuals)
  // =========================
  this.animateSegments(segments, () => {
   this.markers.push(
    this.adapter.createMarker(this.map, actual, {
     color: actualColor,
     scale: 1.35
    })
   );
  });
 }

 // =========================
 // ANIMATION
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

   // MapLibre layer object
   segments[i].remove?.(); // safety
   segments[i] = segments[i]; // already added via adapter

   i++;
   setTimeout(step, 16);
  };

  step();
 }

 // =========================
 // CLEAR
 // =========================
 clear() {
  this.markers.forEach(m => this.adapter.removeMarker(m));
  this.lines.forEach(l => l?.remove?.());

  this.markers = [];
  this.lines = [];
 }

 // =========================
 // RESIZE FIX (MapLibre critical)
 // =========================
 forceResize() {
  if (!this.map) return;

  if (this._resizeRAF) {
   cancelAnimationFrame(this._resizeRAF);
  }

  this._resizeRAF = requestAnimationFrame(() => {
   this.map.resize();

   // 🔥 ВАЖНО: повторный fit после resize
   const bounds = this.map.getBounds?.();
   if (bounds) {
    this.map.fitBounds(bounds, { duration: 0 });
   }

   this._resizeRAF = null;
  });
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
