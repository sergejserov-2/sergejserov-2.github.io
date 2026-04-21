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
 // RENDER (FIXED FOR GameFlow STATE)
 // =========================

 render(payload) {
  if (!this.map) return;

  const state = payload?.state ?? payload;

  const rounds = state?.rounds;
  if (!rounds || rounds.length === 0) return;

  const round = rounds[rounds.length - 1];

  const guess = round?.guess?.guess;
  const actual = round?.actualLocation;

  if (!guess || !actual) return;

  this.clear();

  const playerId = "p1";

  const playerColor = this.uiBuilder.getPlayerColor(playerId);
  const actualColor = this.uiBuilder.getActualColor();

  // =========================
  // MARKERS
  // =========================

  const guessMarker = this.adapter.createMarker(this.map, guess, {
   color: playerColor,
   size: 20
  });

  const actualMarker = this.adapter.createMarker(this.map, actual, {
   color: actualColor,
   size: 30
  });

  // =========================
  // GRADIENT LINE
  // =========================

  const segments = this.adapter.createGradientPolyline(
   this.map,
   [guess, actual],
   playerColor,
   actualColor,
   14
  );

  // =========================
  // CAMERA
  // =========================

  this.fitToPoints([guess, actual]);

  this.markers.push(guessMarker, actualMarker);
  this.lines.push(...segments);
 }

 // =========================
 // CAMERA LOGIC
 // =========================

 fitToPoints(points) {
  if (!this.map || !points || points.length < 2) return;

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
 // MULTIPLAYER SUPPORT
 // =========================

 addPlayerResult({ guess, actual, playerId }) {
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
