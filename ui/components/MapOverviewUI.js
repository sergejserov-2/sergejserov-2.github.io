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

  const playerColor = this.uiBuilder.getPlayerColor("p1");
  const actualColor = this.uiBuilder.getActualColor();

  // ALWAYS actual
  const actualMarker = this.adapter.createMarker(this.map, actual, {
   color: actualColor,
   size: 24
  });

  this.markers.push(actualMarker);

  // guess only if exists (timeout-safe)
  if (guess) {
   const guessMarker = this.adapter.createMarker(this.map, guess, {
    color: playerColor,
    size: 18
   });

   this.markers.push(guessMarker);

   const segments = this.adapter.createGradientPolyline(
    this.map,
    [guess, actual],
    playerColor,
    actualColor,
    14
   );

   this.lines.push(...segments);
  }

  this.fitToPoints(
   guess ? [guess, actual] : [actual, actual]
  );
 }

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
