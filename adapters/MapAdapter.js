import { Geometry } from "../../domain/math/Geometry.js";

export class MapAdapter {
 constructor() {
  this.map = null;
  this._lines = new Set();
 }

 toLngLat(p) {
  return [p.lng, p.lat];
 }

 createMap(element, { center, zoom }) {
  const key = "PnzOFXp1MIxIAe8nTmbt";

  this.map = new maplibregl.Map({
   container: element,
   style: `https://api.maptiler.com/maps/019db4b1-7dea-76e9-b311-977e10dcd80c/style.json?key=${key}`,
   center: this.toLngLat(center),
   zoom,
   attributionControl: false
  });

  return this.map;
 }

 resize(map) {
  requestAnimationFrame(() => {
   requestAnimationFrame(() => {
    map?.resize?.();
   });
  });
 }

 // =========================
 // MARKER (2 круга)
 // =========================
 createMarker(map, { lat, lng }, { color = "#ff4d4d", scale = 1 } = {}) {
  const size = 22 * scale;

  const el = document.createElement("div");

  el.innerHTML = `
   <div style="width:${size}px;height:${size}px;position:relative;">
    <div style="
     position:absolute;
     width:100%;
     height:100%;
     border-radius:50%;
     border:2px solid ${color};
     opacity:0.6;
    "></div>

    <div style="
     position:absolute;
     top:50%;
     left:50%;
     transform:translate(-50%,-50%);
     width:${size * 0.4}px;
     height:${size * 0.4}px;
     background:${color};
     border-radius:50%;
    "></div>
   </div>
  `;

  return new maplibregl.Marker({ element: el })
   .setLngLat(this.toLngLat({ lat, lng }))
   .addTo(map);
 }

 removeMarker(m) {
  m?.remove?.();
 }

 // =========================
 // CLEAR LINES
 // =========================
 clearLines(map) {
  this._lines.forEach(id => {
   if (map.getLayer(id)) map.removeLayer(id);
   if (map.getSource(id)) map.removeSource(id);
  });
  this._lines.clear();
 }

 // =========================
 // CINEMATIC ANIMATION (FIX)
 // =========================
 animateLine(map, start, end, colorA, colorB) {
  const id = `line-${Math.random()}`;

  const steps = Math.min(
   120, // 🔥 ограничение — убирает лаги
   Geometry.getSegmentsCount(
    Geometry.distance(start, end)
   )
  );

  const coords = [];

  for (let i = 0; i <= steps; i++) {
   const t = i / steps;

   coords.push([
    start.lng + (end.lng - start.lng) * t,
    start.lat + (end.lat - start.lat) * t
   ]);
  }

  map.addSource(id, {
   type: "geojson",
   data: {
    type: "Feature",
    geometry: {
     type: "LineString",
     coordinates: [coords[0]]
    }
   },
   lineMetrics: true // 🔥 КРИТИЧНО
  });

  map.addLayer({
   id,
   type: "line",
   source: id,
   paint: {
    "line-width": 3,
    "line-gradient": [
     "interpolate",
     ["linear"],
     ["line-progress"],
     0, colorA,
     1, colorB
    ]
   }
  });

  this._lines.add(id);

  return new Promise(resolve => {
   let i = 1;

   const animate = () => {
    const source = map.getSource(id);
    if (!source) return;

    const t = i / steps;

    source.setData({
     type: "Feature",
     geometry: {
      type: "LineString",
      coordinates: coords.slice(0, i)
     }
    });

    // 🔥 СИНХРОННАЯ КАМЕРА
    this.updateCamera(map, start, end, t);

    i++;

    if (i <= steps) {
     requestAnimationFrame(animate);
    } else {
     resolve();
    }
   };

   animate();
  });
 }

 // =========================
 // CAMERA (FIXED)
 // =========================
 updateCamera(map, a, b, t) {
  const center = {
   lng: (a.lng + b.lng) / 2,
   lat: (a.lat + b.lat) / 2
  };

  const dx = Math.abs(a.lng - b.lng);
  const dy = Math.abs(a.lat - b.lat);
  const span = Math.max(dx, dy);

  const zoom =
   6 -
   span * 1.3 -
   t * 2.2;

  map.jumpTo({
   center: [center.lng, center.lat],
   zoom: Math.max(1.4, zoom)
  });
 }
}
