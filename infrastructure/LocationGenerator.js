import { MathUtil } from "../core/Math.js";

export class LocationGenerator {
  constructor(mapAdapter) {
    this.mapAdapter = mapAdapter;
    this.maxAttempts = 50;
    this.maxTriesPerPoint = 100;
  }

  async generate(area) {
    const polygon = area.polygonPoints;
    const bounds = MathUtil.getBounds(polygon);
    let attempts = 0;
    while (attempts < this.maxAttempts) {
      attempts++;
      const point = this.findPointInArea(bounds, polygon);
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

  // INTERNAL: POINT SEARCH
  findPointInArea(bounds, polygon) {
    let tries = 0;
    while (tries < this.maxTriesPerPoint) {
      tries++;
      const point = MathUtil.randomPointInBounds(bounds);
      if (MathUtil.isInsidePolygon(point, polygon)) {
        return point;
      }
    }
    throw new Error("Failed to generate point inside polygon");
  }
}
