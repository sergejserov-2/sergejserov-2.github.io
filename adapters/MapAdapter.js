import { Geometry } from "../../domain/math/Geometry.js";

export class MapAdapter {
 constructor() {
  this.map = null;
  this._lines = new Set();
 }

 // =========================
 // COORDS
 // =========================
 toLngLat(p) {
  return [p.lng, p.lat];
 }

 // =========================
 // MAP
 // =========================
 createMap(element, { center = { lat: 0, lng: 0 }, zoom = 2 } = {}) {
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
  map?.resize?.();
 }

 // =========================
 // CAMERA (НОРМАЛЬНАЯ)
 // =========================
 fitBounds(map, points, { padding = 80, duration = 800 } = {}) {
  const bounds = new maplibregl.LngLatBounds();

  points.forEach(p => bounds.extend(this.toLngLat(p)));

  map.fitBounds(bounds, {
   padding,
   duration
  });
 }

 // =========================
 // MARKER (2 кружка)
 // =========================
 createMarker(map, { lat, lng }, { color = "#ff4d4d", scale = 1 } = {}) {
  const size = 22 * scale;

  const el = document.createElement("div");

  el.innerHTML = `
   <div style="
    width:${size}px;
    height:${size}px;
    position:relative;
   ">
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
     transform:translate(-50%, -50%);
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

 removeMarker(marker) {
  marker?.remove?.();
 }

 // =========================
 // LINE (контролируемая)
 // =========================
 createLine(map, path, color = "#fff") {
  const id = `line-${Math.random()}`;

  map.addSource(id, {
   type: "geojson",
   data: {
    type: "Feature",
    geometry: {
     type: "LineString",
     coordinates: path.map(p => this.toLngLat(p))
    }
   }
  });

  map.addLayer({
   id,
   type: "line",
   source: id,
   paint: {
    "line-width": 3,
    "line-color": color
   }
  });

  this._lines.add(id);

  return id;
 }

 clearLines(map) {
  this._lines.forEach(id => {
   if (map.getLayer(id)) map.removeLayer(id);
   if (map.getSource(id)) map.removeSource(id);
  });

  this._lines.clear();
 }

 // =========================
 // ANIMATION (фикс)
 // =========================
 async animateLine(map, start, end, colorA, colorB) {
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

  const id = `anim-${Math.random()}`;

  map.addSource(id, {
   type: "geojson",
   data: {
    type: "Feature",
    geometry: {
     type: "LineString",
     coordinates: [this.toLngLat(start)]
    }
   }
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

   const step = () => {
    const source = map.getSource(id);
    if (!source) return;

    source.setData({
     type: "Feature",
     geometry: {
      type: "LineString",
      coordinates: coords.slice(0, i).map(p => [p.lng, p.lat])
     }
    });

    i++;

    if (i <= steps) {
     requestAnimationFrame(step);
    } else {
     resolve();
    }
   };

   step();
  });
 }
}
