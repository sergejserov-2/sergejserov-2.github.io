export class Geometry {

 getRandomPointInPolygon(polygon) {
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

 isPointInPolygon(point, polygon) {
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
}
