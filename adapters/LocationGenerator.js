export class LocationGenerator {
    constructor({ mapAdapter, geometry }) {
        this.mapAdapter = mapAdapter;
        this.geometry = geometry;
    }

    async generate(area) {
        const polygon = area.polygon;

        while (true) {
            const point = this.geometry.getRandomPointInPolygon(polygon);

            const { status } =
                await this.mapAdapter.getStreetViewMeta(point);

            const isValid = status === "OK";

            if (isValid) return point;
        }
    }
}
