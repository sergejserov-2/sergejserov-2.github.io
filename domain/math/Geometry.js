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

  // =========================
  // PATH GENERATION (UI-AGNOSTIC)
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

  static toRad(v) {
    return (v * Math.PI) / 180;
  }
}
