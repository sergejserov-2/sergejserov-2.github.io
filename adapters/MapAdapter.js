export class MapAdapter {
 constructor() {
  this.map = null;
 }

createMap(element, { center = { lat: 0, lng: 0 }, zoom = 2 } = {}) {
  if (!element) throw new Error("Map container missing");

  const MAPTILER_KEY = "PnzOFXp1MIxIAe8nTmbt";

  this.map = L.map(element, {
    zoomControl: false,
    attributionControl: false
  }).setView([center.lat, center.lng], zoom);

  // =========================
  // 🗺 BASE TILE (CUSTOM STYLE)
  // =========================
  L.tileLayer(
    `https://api.maptiler.com/maps/019db4a6-96e9-70d5-a214-f01c8c0ea283/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
    {
      tileSize: 512,
      zoomOffset: -1,
      minZoom: 1,
      maxZoom: 19,
      crossOrigin: true,
      attribution: '&copy; MapTiler &copy; OpenStreetMap contributors'
    }
  ).addTo(this.map);

  return this.map;
}

 // =========================
 // MARKER (NEW STYLE)
 // =========================
 createMarker(map, { lat, lng }, options = {}) {
  const {
   color = "#ff4d4d",
   scale = 1
  } = options;

  const size = 24 * scale;

  const icon = L.divIcon({
   className: "custom-marker",
   html: `
    <div style="
      width:${size}px;
      height:${size}px;
      display:flex;
      align-items:center;
      justify-content:center;
      position:relative;
    ">

      <!-- OUTER RING -->
      <div style="
        position:absolute;
        width:${size * 0.75}px;
        height:${size * 0.75}px;
        border-radius:50%;
        border:2px solid ${color};
        opacity:0.7;
      "></div>

      <!-- INNER DOT -->
      <div style="
        width:${size * 0.35}px;
        height:${size * 0.35}px;
        background:${color};
        border-radius:50%;
        box-shadow:
          0 0 0 3px rgba(0,0,0,0.25),
          0 0 10px rgba(0,0,0,0.2);
      "></div>

    </div>
   `,
   iconSize: [size, size],
   iconAnchor: [size / 2, size / 2]
  });

  return L.marker([lat, lng], { icon }).addTo(map);
 }

 removeMarker(marker) {
  marker?.remove?.();
 }

 // =========================
 // POLYLINE
 // =========================
 createPolyline(map, path, options = {}) {
  const { color = "#ff4d4d" } = options;

  return L.polyline(path, {
   color,
   weight: 2
  }).addTo(map);
 }

 // =========================
 // GRADIENT (как у тебя было)
 // =========================
 createGradientPolyline(map, path, fromColor, toColor, steps = 12) {
  const segments = [];

  for (let i = 0; i < steps; i++) {
   const t1 = i / steps;
   const t2 = (i + 1) / steps;

   const p1 = this._interpolate(path[0], path[1], t1);
   const p2 = this._interpolate(path[0], path[1], t2);

   const color = this._mixColor(fromColor, toColor, t1);

   const line = L.polyline([p1, p2], {
    color,
    weight: 3
   });

   segments.push(line);
  }

  return segments;
 }

 createPolygon(map, path, options = {}) {
  const {
   strokeColor = "#4ea1ff",
   fillColor = "#4ea1ff"
  } = options;

  return L.polygon(path, {
   color: strokeColor,
   fillColor,
   fillOpacity: 0.15,
   weight: 2
  }).addTo(map);
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
}
