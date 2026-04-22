
export class Geometry {
 // =========================
 // DISTANCE (HAVERSINE)
 // =========================
 static distance(a, b) {
  const R = 6371;

  const dLat = this.toRad(b.lat - a.lat);
  const dLng = this.toRad(b.lng - a.lng);

  const lat1 = this.toRad(a.lat);
  const lat2 = this.toRad(b.lat);

  const x =
   Math.sin(dLat / 2) ** 2 +
   Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
 }

 // =========================
 // 🌍 GREAT CIRCLE (NEW)
 // =========================
 static buildGreatCircle(a, b, steps = 64) {
  const toRad = this.toRad;
  const toDeg = r => (r * 180) / Math.PI;

  const lat1 = toRad(a.lat);
  const lon1 = toRad(a.lng);
  const lat2 = toRad(b.lat);
  const lon2 = toRad(b.lng);

  const d = 2 * Math.asin(Math.sqrt(
   Math.sin((lat2 - lat1) / 2) ** 2 +
   Math.cos(lat1) * Math.cos(lat2) *
   Math.sin((lon2 - lon1) / 2) ** 2
  ));

  if (d === 0) return [a, b];

  const points = [];

  for (let i = 0; i <= steps; i++) {
   const f = i / steps;

   const A = Math.sin((1 - f) * d) / Math.sin(d);
   const B = Math.sin(f * d) / Math.sin(d);

   const x =
    A * Math.cos(lat1) * Math.cos(lon1) +
    B * Math.cos(lat2) * Math.cos(lon2);

   const y =
    A * Math.cos(lat1) * Math.sin(lon1) +
    B * Math.cos(lat2) * Math.sin(lon2);

   const z =
    A * Math.sin(lat1) +
    B * Math.sin(lat2);

   const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
   const lon = Math.atan2(y, x);

   points.push({
    lat: toDeg(lat),
    lng: toDeg(lon)
   });
  }

  return points;
 }

 // =========================
 // RANDOM POINT IN POLYGON
 // =========================
 static getRandomPointInPolygon(polygon) {
  const lats = polygon.map(p => p.lat);
  const lngs = polygon.map(p => p.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  let attempts = 0;

  while (attempts < 500) {
   attempts++;

   const point = {
    lat: minLat + Math.random() * (maxLat - minLat),
    lng: minLng + Math.random() * (maxLng - minLng)
   };

   if (this.isPointInPolygon(point, polygon)) {
    return point;
   }
  }

  throw new Error("Failed to generate point in polygon");
 }

 // =========================
 // POINT IN POLYGON
 // =========================
 static isPointInPolygon(point, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
   const a = polygon[i];
   const b = polygon[j];

   const intersect =
    (a.lng > point.lng) !== (b.lng > point.lng) &&
    point.lat <
     ((b.lat - a.lat) * (point.lng - a.lng)) /
      ((b.lng - a.lng) || 1e-10) +
     a.lat;

   if (intersect) inside = !inside;
  }

  return inside;
 }

 // =========================
 // AREA SCALE
 // =========================
 static getAreaScale(area) {
  if (!area?.polygon?.length) return 2000;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of area.polygon) {
   if (p.lat < minLat) minLat = p.lat;
   if (p.lat > maxLat) maxLat = p.lat;
   if (p.lng < minLng) minLng = p.lng;
   if (p.lng > maxLng) maxLng = p.lng;
  }

  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;

  const diagonalDeg = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  const diagonalKm = diagonalDeg * 111;

  return diagonalKm * 0.7;
 }

 // =========================
 // BOUNDS
 // =========================
 static getBounds(a, b, padding = 0.25) {
  const minLat = Math.min(a.lat, b.lat);
  const maxLat = Math.max(a.lat, b.lat);
  const minLng = Math.min(a.lng, b.lng);
  const maxLng = Math.max(a.lng, b.lng);

  const latPad = (maxLat - minLat) * padding || 0.5;
  const lngPad = (maxLng - minLng) * padding || 0.5;

  return {
   minLat: minLat - latPad,
   maxLat: maxLat + latPad,
   minLng: minLng - lngPad,
   maxLng: maxLng + lngPad
  };
 }

 // =========================
 // UTILS
 // =========================
 static toRad(v) {
  return (v * Math.PI) / 180;
 }
}
