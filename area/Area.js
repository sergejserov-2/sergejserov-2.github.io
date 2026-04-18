export class AreaRules {
    constructor(polygonPoints, minimumDistanceForPoints, name) {
        this.polygonPoints = polygonPoints; // чистые координаты
        this.minimumDistanceForPoints = minimumDistanceForPoints;
        this.name = name;
    }

    // проверка: точка внутри полигона (ray casting)
    isInMap(lat, lng) {
        let inside = false;

        for (let i = 0, j = this.polygonPoints.length - 1; i < this.polygonPoints.length; j = i++) {
            const xi = this.polygonPoints[i].lat;
            const yi = this.polygonPoints[i].lng;

            const xj = this.polygonPoints[j].lat;
            const yj = this.polygonPoints[j].lng;

            const intersect =
                ((yi > lng) !== (yj > lng)) &&
                (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    // правило: считается ли точка "близкой"
    isCloseEnough(distance) {
        return distance < 7.5;
    }

    // правило: насколько далеко допустимая зона влияния
    getMinimumDistance() {
        return this.minimumDistanceForPoints;
    }
}
