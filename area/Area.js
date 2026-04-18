export class Area {
    constructor({ name, polygonPoints }) {
        this.name = name;

        // [[lat, lng], [lat, lng], ...]
        this.polygonPoints = polygonPoints;
    }
}
