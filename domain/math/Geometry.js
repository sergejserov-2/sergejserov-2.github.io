export class Geometry {
 static distance(a, b) {
  const R = 6371;

  const dLat = Geometry.toRad(b.lat - a.lat);
  const dLng = Geometry.toRad(b.lng - a.lng);

  const lat1 = Geometry.toRad(a.lat);
  const lat2 = Geometry.toRad(b.lat);

  const x =
   Math.sin(dLat / 2) ** 2 +
   Math.sin(dLng / 2) ** 2 *
   Math.cos(lat1) *
   Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(x));
 }

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

   if (Geometry.isPointInPolygon(point, polygon)) {
    return point;
   }
  }

  throw new Error("Failed to generate point in polygon");
 }

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

 static toRad(v) {
  return (v * Math.PI) / 180;
 }
}
