export class AreaRules {
    constructor(polygonPoints, minimumDistanceForPoints, name) {
        this.minimumDistanceForPoints = minimumDistanceForPoints;
        this.name = name;

        this.polygonPoints = polygonPoints;
    }

    // проверка попадания точки в полигон (ray casting алгоритм)
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

    // только правило: "как интерпретировать расстояние"
    isCloseEnough(distance) {
        return distance < 7.5;
    }

    // чистая нормализация порога (без игровой экономики)
    normalizeDistance(distance) {
        return Math.max(0, this.minimumDistanceForPoints - distance);
    }
}
