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
  // PATH UTILITIES
  // =========================
  static lerp(a, b, t) {
    return {
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t
    };
  }

  static createPath(a, b, segments = 30) {
    const path = [];

    for (let i = 0; i <= segments; i++) {
      path.push(this.lerp(a, b, i / segments));
    }

    return path;
  }

  static getSegmentsCount(distance) {
    if (distance < 50) return 10;
    if (distance < 200) return 20;
    if (distance < 1000) return 40;
    return 80;
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
  // BOUNDS (🔥 NEW)
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
