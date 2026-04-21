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
    size = 20,
    isActual = false
  } = options;

  // actual чуть больше
  const finalSize = isActual ? size * 1.4 : size;

  const radius = finalSize * 0.28;
  const stroke = finalSize * 0.12;

  const pad = stroke * 2;
  const viewBox = finalSize + pad * 2;

  const c = viewBox / 2;

  const svg = `
<svg width="${viewBox}" height="${viewBox}" viewBox="0 0 ${viewBox} ${viewBox}" xmlns="http://www.w3.org/2000/svg">

  <!-- shadow (ТОЛЬКО ТЕНЬ) -->
  <circle cx="${c}" cy="${c + 1.5}" r="${radius}"
    fill="rgba(0,0,0,0.25)"/>

  <!-- border -->
  <circle cx="${c}" cy="${c}" r="${radius}"
    fill="${color}" opacity="0.95"
    stroke="rgba(0,0,0,0.25)"
    stroke-width="${stroke}"/>

</svg>`;

  return new google.maps.Marker({
    position: { lat, lng },
    map,
    icon: {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),

      scaledSize: new google.maps.Size(viewBox, viewBox),
      anchor: new google.maps.Point(viewBox / 2, viewBox / 2)
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

 createPolygon(map, path, options = {}) {
 const {
  strokeColor = "#4ea1ff",
  fillColor = "#4ea1ff"
 } = options;

 return new google.maps.Polygon({
  paths: path,
  strokeColor,
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor,
  fillOpacity: 0.15,
  map
 });
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
