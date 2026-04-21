export class MapAdapter {
 constructor() {}

 createMap(element, { center = { lat: 0, lng: 0 }, zoom = 2 } = {}) {
  if (!element) throw new Error("Map container missing");

  return new google.maps.Map(element, {
   center,
   zoom,
   disableDefaultUI: true
  });
 }

 createMarker(map, { lat, lng }, options = {}) {
  const {
   color = "#ff4d4d",
   size = 20
  } = options;

const radius = size * 0.3;
const outerRadius = radius + 3;

const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
  <circle cx="10" cy="10" r="${radius}" fill="${color}" opacity="0.9"/>
  <circle cx="10" cy="10" r="${outerRadius}" stroke="${color}" stroke-width="2" fill="none" opacity="0.4"/>
</svg>`;

  return new google.maps.Marker({
   position: { lat, lng },
   map,
   icon: {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2)
   },
   optimized: false
  });
 }

 removeMarker(marker) {
  marker?.setMap(null);
 }

 createPolyline(map, path, options = {}) {
  const { color = "#ff4d4d" } = options;

  return new google.maps.Polyline({
   path,
   geodesic: true,
   strokeColor: color,
   strokeOpacity: 1,
   strokeWeight: 2,
   map
  });
 }

 // =========================
 // 🌈 GRADIENT LINE
 // =========================

 createGradientPolyline(map, path, fromColor, toColor, steps = 12) {
  const segments = [];

  for (let i = 0; i < steps; i++) {
   const t1 = i / steps;
   const t2 = (i + 1) / steps;

   const p1 = this._interpolate(path[0], path[1], t1);
   const p2 = this._interpolate(path[0], path[1], t2);

   const color = this._mixColor(fromColor, toColor, t1);

   const line = new google.maps.Polyline({
    path: [p1, p2],
    geodesic: true,
    strokeColor: color,
    strokeOpacity: 1,
    strokeWeight: 3,
    map
   });

   segments.push(line);
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
}
