export class LocationGenerator {
  constructor(mapAdapter) {
    this.mapAdapter = mapAdapter;
    this.maxAttempts = 50;
  }

  async generate(area) {
    const polygon = area.polygonPoints;
    let attempts = 0;
    while (attempts < this.maxAttempts) {
      attempts++;
      const point = this.randomPointInPolygon(polygon);
      const isValid = await this.mapAdapter.hasStreetView(
        point.lat,
        point.lng
      );
      if (isValid) {
        return point;
      }
    }

    throw new Error(`No valid Street View point in area: ${area.name}`);
  }

  // PURE GEOMETRY (NO EXTERNAL DEPENDENCIES)
  randomPointInPolygon(polygon) {
    const bounds = this.getBounds(polygon);
    let tries = 0;
    while (tries < 100) {
      tries++;
      const point = {
        lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
        lng: bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng)
      };
      if (this.isInsidePolygon(point, polygon)) {
        return point;
      }
    }
    throw new Error("Failed to generate point inside polygon");
  }

  getBounds(polygon) {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const [lat, lng] of polygon) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    return { minLat, maxLat, minLng, maxLng };
  }

  // RAY CASTING (POINT IN POLYGON)
  isInsidePolygon(point, polygon) {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect =
        yi > point.lat !== yj > point.lat &&
        point.lng <
          ((xj - xi) * (point.lat - yi)) / (yj - yi + 1e-9) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }
}
