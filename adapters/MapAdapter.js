
import { Geometry } from "../../domain/math/Geometry.js";

export class MapAdapter {
 constructor() {
  this.map = null;
 }

 // =========================
 // COORDS
 // =========================
 toLngLat(p) {
  return [p.lng, p.lat];
 }

 fromLngLat(p) {
  return { lat: p[1], lng: p[0] };
 }

 // =========================
 // MAP
 // =========================
 createMap(element, { center = { lat: 0, lng: 0 }, zoom = 2 } = {}) {
  if (!element) throw new Error("Map container missing");

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

 // =========================
 // CAMERA (ключевая логика)
 // =========================
 updateCameraProgress(map, a, b, t) {
  const lng1 = a.lng;
  const lat1 = a.lat;
  const lng2 = b.lng;
  const lat2 = b.lat;

  const center = {
   lng: lng1 + (lng2 - lng1) * 0.5,
   lat: lat1 + (lat2 - lat1) * 0.5
  };

  // 🔥 расстояние между точками
  const dx = Math.abs(lng2 - lng1);
  const dy = Math.abs(lat2 - lat1);
  const span = Math.max(dx, dy);

  // 🔥 zoom логика (чем дальше линия растёт — тем больше отдаление)
  const zoom =
   6 -
   span * 1.2 -
   t * 2.5; // ← ключ: синхронный отъезд камеры

  map.setCenter([center.lng, center.lat]);
  map.setZoom(Math.max(1.5, zoom));
 }

 // =========================
 // MARKER
 // =========================
 createMarker(map, { lat, lng }, options = {}) {
  const { color = "#ff4d4d", scale = 1 } = options;

  const size = 24 * scale;

  const el = document.createElement("div");

  el.innerHTML = `
   <div style="
    width:${size}px;
    height:${size}px;
    position:relative;
    display:flex;
    align-items:center;
    justify-content:center;
   ">
    <div style="
     position:absolute;
     width:${size * 0.75}px;
     height:${size * 0.75}px;
     border-radius:50%;
     border:2px solid ${color};
     opacity:0.7;
    "></div>

    <div style="
     width:${size * 0.35}px;
     height:${size * 0.35}px;
     background:${color};
     border-radius:50%;
     box-shadow:0 0 0 3px rgba(0,0,0,0.25);
    "></div>
   </div>
  `;

  return new maplibregl.Marker({ element: el })
   .setLngLat(this.toLngLat({ lat, lng }))
   .addTo(map);
 }

 removeMarker(marker) {
  marker?.remove?.();
 }

 // =========================
 // GRADIENT + ANIMATION
 // =========================
 createGradientPolyline(map, path, fromColor, toColor, onProgress) {
  const id = `line-${Math.random().toString(36).slice(2)}`;

  const [start, end] = path;

  const steps = Geometry.getSegmentsCount(
   Geometry.distance(start, end)
  );

  const coords = [];

  for (let i = 0; i <= steps; i++) {
   const t = i / steps;

   coords.push({
    lng: start.lng + (end.lng - start.lng) * t,
    lat: start.lat + (end.lat - start.lat) * t
   });
  }

  return new Promise((resolve) => {
   map.addSource(id, {
    type: "geojson",
    data: {
     type: "Feature",
     geometry: {
      type: "LineString",
      coordinates: [this.toLngLat(start)]
     }
    },
    lineMetrics: true
   });

   map.addLayer({
    id,
    type: "line",
    source: id,
    layout: {
     "line-cap": "round",
     "line-join": "round"
    },
    paint: {
     "line-width": 3,
     "line-gradient": [
      "interpolate",
      ["linear"],
      ["line-progress"],
      0, fromColor,
      1, toColor
     ]
    }
   });

   let i = 1;

   const animate = () => {
    const t = i / steps;

    const source = map.getSource(id);
    if (!source) return;

    source.setData({
     type: "Feature",
     geometry: {
      type: "LineString",
      coordinates: coords.slice(0, i).map(p => [p.lng, p.lat])
     }
    });

    // 🔥 синхронная камера
    onProgress?.(t, coords[i - 1]);

    i++;

    if (i <= steps) {
     requestAnimationFrame(animate);
    } else {
     resolve();
    }
   };

   requestAnimationFrame(animate);
  });
 }
}
