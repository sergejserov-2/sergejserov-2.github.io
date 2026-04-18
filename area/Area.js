export class Area {
    constructor({ name, polygon }) {
        this.name = name;

        // [[lat, lng], [lat, lng], ...]
        this.polygon = polygon;
    }
}
