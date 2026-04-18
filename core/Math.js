export class Math {

    distance(from, to) {
        const R = 6371000; // радиус Земли в метрах
        const toRad = (deg) => deg * Math.PI / 180;

        const dLat = toRad(to.lat - from.lat);
        const dLng = toRad(to.lng - from.lng);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(from.lat)) *
            Math.cos(toRad(to.lat)) *
            Math.sin(dLng / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    calculateScore(distance) {
        const max = 5000;
        return Math.max(0, Math.round(max - distance));
    }

    calculateResult(distance) {
        return {
            distance,
            score: this.calculateScore(distance)
        };
    }
}
