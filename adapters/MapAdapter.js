import L from "leaflet";

export class MapAdapter {
 constructor() {
  this.map = null;
 }

 // =========================
 // MAP
 // =========================
 createMap(element, { center = { lat: 0, lng: 0 }, zoom = 2 } = {}) {
  if (!element) throw new Error("Map container missing");

  this.map = L.map(element, {
   zoomControl: true,
   attributionControl: false
  }).setView([center.lat, center.lng], zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
   maxZoom: 19
  }).addTo(this.map);

  return this.map;
 }

 // =========================
 // MARKER
 // =========================
 createMarker(map, { lat, lng }, options = {}) {
  const { color = "#ff4d4d", scale = 1 } = options;

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
    ">
      <div style="
        width:${size * 0.4}px;
        height:${size * 0.4}px;
        background:${color};
        border-radius:50%;
        box-shadow:0 0 0 4px rgba(0,0,0,0.15);
      "></div>
    </div>
   `,
   iconSize: [size, size],
   iconAnchor: [size / 2, size / 2]
  });

  const marker = L.marker([lat, lng], { icon }).addTo(map);

  return marker;
 }

 removeMarker(marker) {
  marker?.remove();
 }

 // =========================
 // POLYLINE
 // =========================
 createPolyline(map, path, options = {}) {
  const { color = "#ff4d4d" } = options;

  const line = L.polyline(
   path.map(p => [p.lat, p.lng]),
   {
    color,
    weight: 2
   }
  ).addTo(map);

  return line;
 }

 // =========================
 // GRADIENT POLYLINE (segments)
 // =========================
 createGradientPolyline(map, path, fromColor, toColor, steps = 12) {
  const segments = [];

  for (let i = 0; i < steps; i++) {
   const t1 = i / steps;
   const t2 = (i + 1) / steps;

   const p1 = this._interpolate(path[0], path[1], t1);
   const p2 = this._interpolate(path[0], path[1], t2);

   const color = this._mixColor(fromColor, toColor, t1);

   const line = L.polyline(
    [
     [p1.lat, p1.lng],
     [p2.lat, p2.lng]
    ],
    {
     color,
     weight: 3,
     opacity: 0.9
    }
   );

   segments.push(line);
  }

  return segments;
 }

 // =========================
 // POLYGON
 // =========================
 createPolygon(map, path, options = {}) {
  const {
   strokeColor = "#4ea1ff",
   fillColor = "#4ea1ff"
  } = options;

  const poly = L.polygon(
   path.map(p => [p.lat, p.lng]),
   {
    color: strokeColor,
    fillColor,
    fillOpacity: 0.15,
    weight: 2
   }
  ).addTo(map);

  return poly;
 }

 // =========================
 // VIEWPORT FIX (ВАЖНО)
 // =========================
 fitBounds(map, points) {
  if (!points?.length) return;

  const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));

  map.fitBounds(bounds, {
   padding: [40, 40]
  });
 }

 setCenter(map, center) {
  map.setView([center.lat, center.lng]);
 }

 setZoom(map, zoom) {
  map.setZoom(zoom);
 }

 // =========================
 // INTERNALS
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
