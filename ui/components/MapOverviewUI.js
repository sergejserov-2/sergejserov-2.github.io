import { Geometry } from "../../domain/math/Geometry.js";

export class MapOverviewUI {
 constructor({ adapter, element, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;
  this.element = element;

  this.map = null;
  this.markers = [];
  this._resizeObserver = null;
 }

 init() {
  if (!this.element) return;

  this.map = this.adapter.createMap(this.element, {
   center: { lat: 20, lng: 0 },
   zoom: 2
  });

  this._resizeObserver = new ResizeObserver(() => {
   this.map?.resize?.();
  });

  this._resizeObserver.observe(this.element);
 }

 // =========================
 // MAIN FLOW (FIXED CINEMATIC)
 // =========================
 async render(round) {
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

   this.adapter.setCenter(this.map, actual);
   this.adapter.setZoom(this.map, 4);
   return;
  }

  // =========================
  // GUESS MARKER FIRST
  // =========================
  this.markers.push(
   this.adapter.createMarker(this.map, guess, {
    color: playerColor,
    scale: 1
   })
  );

  // =========================
  // LINE + CAMERA SYNC
  // =========================
  await this.adapter.createGradientPolyline(
   this.map,
   [guess, actual],
   playerColor,
   actualColor,
   (t) => {
    this.adapter.updateCameraProgress(
     this.map,
     guess,
     actual,
     t
    );
   }
  );

  // =========================
  // ACTUAL MARKER AFTER ANIMATION
  // =========================
  this.markers.push(
   this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.35
   })
  );
 }

 clear() {
  this.markers.forEach(m => this.adapter.removeMarker(m));
  this.markers = [];
 }
}
