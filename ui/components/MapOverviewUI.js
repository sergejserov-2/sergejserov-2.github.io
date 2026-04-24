export class MapOverviewUI {
 constructor({ adapter, element, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;
  this.element = element;

  this.map = null;
  this.markers = [];
 }

 init() {
  this.map = this.adapter.createMap(this.element, {
   center: { lat: 20, lng: 0 },
   zoom: 2
  });

  requestAnimationFrame(() => {
   this.adapter.resize(this.map);
  });
 }

 async render(round) {
  if (!this.map || !round) return;

  await this.adapter.waitReady(this.map);

  this.clear();

  const actual = round.actualLocation;
  if (!actual) return;

  const actualColor = this.uiBuilder.getActualColor();

const guesses = round.guesses
 ? Object.values(round.guesses)
 : [];

  const points = [actual];

  if (!guesses.length) {
   this.markers.push(
    this.adapter.createMarker(this.map, actual, {
     color: actualColor,
     scale: 1.3
    })
   );
   return;
  }

  for (const g of guesses) {
   const color = this.uiBuilder.getPlayerColor(g.playerId);

   this.markers.push(
    this.adapter.createMarker(this.map, g, {
     color,
     scale: 1
    })
   );

   points.push(g);
  }

  this.fitToAll(points);

  await this.adapter.waitRenderStable(this.map);

  for (const g of guesses) {
   const color = this.uiBuilder.getPlayerColor(g.playerId);

   await this.adapter.animateLine(
    this.map,
    g,
    actual,
    color,
    actualColor
   );
  }

  this.markers.push(
   this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.3
   })
  );
 }

 fitToAll(points) {
  if (!points.length) return;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of points) {
   minLat = Math.min(minLat, p.lat);
   maxLat = Math.max(maxLat, p.lat);
   minLng = Math.min(minLng, p.lng);
   maxLng = Math.max(maxLng, p.lng);
  }

  const center = {
   lat: (minLat + maxLat) / 2,
   lng: (minLng + maxLng) / 2
  };

  const maxDist = Math.max(maxLat - minLat, maxLng - minLng);

  let zoom = 6 - maxDist * 2.2;
  zoom = Math.max(1.5, Math.min(5.5, zoom));

  this.map.setCenter([center.lng, center.lat]);
  this.map.setZoom(zoom);
 }

 clear() {
  this.markers.forEach(m => this.adapter.removeMarker(m));
  this.markers = [];
  this.adapter.clearLines(this.map);
 }
}
