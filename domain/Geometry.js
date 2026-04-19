export class Geometry {

 getRandomPointInPolygon(polygon) {
  // polygon = [{lat,lng}]

  const lats = polygon.map(p => p.lat);
  const lngs = polygon.map(p => p.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  while (true) {
   const point = {
    lat: minLat + Math.random() * (maxLat - minLat),
    lng: minLng + Math.random() * (maxLng - minLng)
   };

   if (this.isPointInPolygon(point, polygon)) {
    return point;
   }
  }
 }

 isPointInPolygon(point, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
   const xi = polygon[i].lat, yi = polygon[i].lng;
   const xj = polygon[j].lat, yj = polygon[j].lng;

   const intersect =
    (yi > point.lng) !== (yj > point.lng) &&
    point.lat < (xj - xi) * (point.lng - yi) / (yj - yi + 0.0000001) + xi;

   if (intersect) inside = !inside;
  }

  return inside;
 }
}
