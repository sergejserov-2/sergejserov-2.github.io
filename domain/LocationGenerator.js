export class LocationGenerator {
    constructor({ geometry }) {
        this.geometry = geometry;
    }

    generate(area) {
        const polygon = area.polygon;
        return this.findValidPoint(polygon);
    }

    findValidPoint(polygon) {
        const bbox = this.geometry.getBoundingBox(polygon);
        let point;
        let tries = 0;

        do {
            point = [
                bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat),
                bbox
