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
   this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.35
   });

   this.adapter.setView(this.map, actual, 4);
   return;
  }

  // =========================
  // GUESS MARKER
  // =========================
  const guessMarker = this.adapter.createMarker(this.map, guess, {
   color: playerColor,
   scale: 1
  });

  this.markers.push(guessMarker);

  // =========================
  // SEGMENTS (hidden first)
  // =========================
  const segments = this.adapter.createGradientPolyline(
   this.map,
   [guess, actual],
   playerColor,
   actualColor,
   14
  );

  // скрываем сразу (анимируем появление)
  segments.forEach(s => s.remove());

  this.lines.push(...segments);

  // =========================
  // FIT — ВАЖНО: ДО АНИМАЦИИ
  // =========================
  requestAnimationFrame(() => {
   this.fitBothPoints(guess, actual);

   // после стабилизации карты — запускаем анимацию
   requestAnimationFrame(() => {
    this.animateSegments(segments, () => {
     const actualMarker = this.adapter.createMarker(this.map, actual, {
      color: actualColor,
      scale: 1.35
     });

     this.markers.push(actualMarker);
    });
   });
  });
 }

 // =========================
 // 🔥 КЛЮЧЕВОЙ FIX: СТАБИЛЬНЫЙ FIT
 // =========================
 fitBothPoints(a, b) {
  if (!this.map || !a || !b) return;

  const group = [
   [a.lat, a.lng],
   [b.lat, b.lng]
  ];

  const bounds = L.latLngBounds(group);

  this.map.fitBounds(bounds, {
   padding: [80, 80],   // 🔥 важно: чтобы не “прилипало” к краям
   maxZoom: 6,          // 🔥 ограничиваем дикий зум
   animate: false       // 🔥 убираем дерганье
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

   segments[i].addTo(this.map);
   i++;

   setTimeout(step, 18);
  };

  step();
 }

 // =========================
 // CLEAR
 // =========================
 clear() {
  this.markers.forEach(m => m?.remove?.());
  this.lines.forEach(l => l?.remove?.());

  this.markers = [];
  this.lines = [];
 }

 // =========================
 // RESIZE FIX (Leaflet correct way)
 // =========================
 forceResize() {
  if (!this.map) return;

  this.map.invalidateSize();

  // 🔥 стабилизируем после layout shift
  setTimeout(() => {
   this.map.invalidateSize();
  }, 50);
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
