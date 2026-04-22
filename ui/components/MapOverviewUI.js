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

 init() {
  if (!this.element) return;

  this.map = this.adapter.createMap(this.element, {
   center: { lat: 20, lng: 0 },
   zoom: 2
  });
 }

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
  // NO GUESS → просто показываем actual
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
  // GUESS FLOW (с анимацией)
  // =========================

  // 1. guess marker
  const guessMarker = this.adapter.createMarker(this.map, guess, {
   color: playerColor,
   scale: 1
  });

  this.markers.push(guessMarker);

  // 2. создаём сегменты (СКРЫТЫЕ)
  const segments = this.adapter.createGradientPolyline(
   null, // 🔥 ВАЖНО: не передаём map сразу
   [guess, actual],
   playerColor,
   actualColor,
   14
  );

  this.lines.push(...segments);

  // 3. позиционируем карту заранее
  this.fitToPoints([guess, actual]);

  // 4. анимируем сегменты
  this.animateSegments(segments, () => {
   // 5. после анимации → actual marker
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

   // 🔥 показываем сегмент
   segment.setMap(this.map);

   index++;
   setTimeout(showNext, delay);
  };

  showNext();
 }

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

 clear() {
  this.markers.forEach(m => this.adapter.removeMarker(m));
  this.lines.forEach(l => l.setMap(null));
  this.markers = [];
  this.lines = [];
 }

 forceResize() {
  if (!this.map) return;
  google.maps.event.trigger(this.map, "resize");
 }
}
