import { Geometry } from "../../domain/math/Geometry.js";

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
   center: { lat: 20, lng: 0 },
   zoom: 2
  });
 }

 // =========================
 // RENDER
 // =========================
 render(round) {
  if (!this.map || !round) return;

  const guess = round.guess;
  const actual = round.actualLocation;

  if (!guess || !actual) return;

  this.clear();

  const playerId = guess.playerId || "p1";

  const playerColor = this.uiBuilder.getPlayerColor(playerId);
  const actualColor = this.uiBuilder.getActualColor();

  // markers
  const guessMarker = this.adapter.createMarker(this.map, guess, {
   color: playerColor,
   size: 18
  });

  const actualMarker = this.adapter.createMarker(this.map, actual, {
   color: actualColor,
   size: 22
  });

  // line
  const segments = this.adapter.createGradientPolyline(
   this.map,
   [guess, actual],
   playerColor,
   actualColor,
   14
  );

  this.fitToPoints([guess, actual]);

  this.markers.push(guessMarker, actualMarker);
  this.lines.push(...segments);
 }

 // =========================
 // CAMERA
 // =========================
 fitToPoints(points) {
  if (!this.map || !points?.length) return;

  const a = points[0];
  const b = points[1];

  if (!a || !b) return;

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
 // FIX FOR GOOGLE MAPS RENDER BUG
 // =========================
forceResize() {
 if (!this.map) return;

 google.maps.event.trigger(this.map, "resize");

 // важно: пересетить камеру после resize
 const last = this.lastFitPoints;
 if (last) {
  this.fitToPoints(last);
 }
}

 // =========================
 // MULTI
 // =========================
 addPlayerResult({ guess, actual, playerId }) {
  if (!this.map || !guess || !actual) return;

  const playerColor = this.uiBuilder.getPlayerColor(playerId);
  const actualColor = this.uiBuilder.getActualColor();

  const guessMarker = this.adapter.createMarker(this.map, guess, {
   color: playerColor,
   size: 20
  });

  const actualMarker = this.adapter.createMarker(this.map, actual, {
   color: actualColor,
   size: 30
  });

  const segments = this.adapter.createGradientPolyline(
   this.map,
   [guess, actual],
   playerColor,
   actualColor,
   14
  );

  this.markers.push(guessMarker, actualMarker);
  this.lines.push(...segments);
 }
}
