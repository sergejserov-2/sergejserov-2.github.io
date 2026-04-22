
export class MapAdapter {
 constructor() {
  this.map = null;
 }

 // =========================
 // COORD CONVERSIONS
 // =========================
 toLngLat(p) {
  return [p.lng, p.lat];
 }

 fromLngLat(p) {
  return { lat: p[1], lng: p[0] };
 }

 // =========================
 // MAP INIT
 // =========================
 createMap(element, { center = { lat: 0, lng: 0 }, zoom = 2 } = {}) {
  if (!element) throw new Error("Map container missing");
  this.key = PnzOFXp1MIxIAe8nTmbt;
  this.map = new maplibregl.Map({
   container: element,

   style: {
    version: 8,
    sources: {
     base: {
      type: "vector",
      url: `https://api.maptiler.com/maps/019db4b1-7dea-76e9-b311-977e10dcd80c/style.json?key=${this.key}`
     }
    },
    layers: []
   },

   center: this.toLngLat(center),
   zoom,
   attributionControl: false
  });

  return this.map;
 }

 // =========================
 // MARKER (custom DOM)
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

  const marker = new maplibregl.Marker({ element: el })
   .setLngLat(this.toLngLat({ lat, lng }))
   .addTo(map);

  return marker;
 }

 removeMarker(marker) {
  marker?.remove?.();
 }

 // =========================
 // CAMERA
 // =========================
 setCenter(map, point) {
  map.setCenter(this.toLngLat(point));
 }

 setZoom(map, zoom) {
  map.setZoom(zoom);
 }

 fitBounds(map, points) {
  const bounds = new maplibregl.LngLatBounds();

  for (const p of points) {
   bounds.extend(this.toLngLat(p));
  }

  map.fitBounds(bounds, {
   padding: 80,
   duration: 0
  });
 }

 // =========================
 // POLYLINE (simple GeoJSON)
 // =========================
 createPolyline(map, path, options = {}) {
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
    "line-color": options.color || "#ff4d4d",
    "line-width": 2
   }
  });

  return {
   id,
   remove: () => {
    if (!map.getLayer(id)) return;
    map.removeLayer(id);
    map.removeSource(id);
   }
  };
 }

 // =========================
 // GRADIENT (упрощённый)
 // =========================
 createGradientPolyline(map, path, fromColor, toColor, steps = 12) {
  const segments = [];

  for (let i = 0; i < steps; i++) {
   const t1 = i / steps;
   const t2 = (i + 1) / steps;

   const p1 = this._interpolate(path[0], path[1], t1);
   const p2 = this._interpolate(path[0], path[1], t2);

   const color = this._mixColor(fromColor, toColor, t1);

   const seg = this.createPolyline(map, [p1, p2], { color });
   segments.push(seg);
  }

  return segments;
 }

 // =========================
 // HELPERS
 // =========================
 _interpolate(a, b, t) {
  return {
   lat: a.lat + (b.lat - a.lat) * t,
   lng: a.lng + (b.lng - a.lng) * t
  };
 }

 _mixColor(c1, c2, t) {
  const a = this._hexToRgb(c1);
  const b = this._hexToRgb(c2);

  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);

  return `rgb(${r},${g},${bl})`;
 }

 _hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
   r: parseInt(h.slice(0, 2), 16),
   g: parseInt(h.slice(2, 4), 16),
   b: parseInt(h.slice(4, 6), 16)
  };
 }

 // =========================
 // RESIZE
 // =========================
 triggerResize(map) {
  map?.resize?.();
 }
}
