export class LocationGenerator {
    constructor({ mapAdapter, geometry }) {
        this.mapAdapter = mapAdapter;
        this.geometry = geometry;

        this.maxAttempts = 50;
        this.maxTriesPerPoint = 100;
    }

    // =====================================================
    // MAIN
    // =====================================================

    async generate(area) {
        const polygon = area.polygon;
        const bounds = this.geometry.getBounds(polygon);

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

        throw new Error(
            `No valid Street View point in area: ${area.name}`
        );
    }

    // =====================================================
    // INTERNAL: POINT SEARCH
    // =====================================================

    findPointInArea(bounds, polygon) {
        let tries = 0;

        while (tries < this.maxTriesPerPoint) {
            tries++;

            const point = this.geometry.randomPointInBounds(bounds);

            if (this.geometry.isInsidePolygon(point, polygon)) {
                return point;
            }
        }

        throw new Error("Failed to generate point inside polygon");
    }
}
