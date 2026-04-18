export class Scoring {
    constructor(mapAdapter) {
        this.mapAdapter = mapAdapter;
    }

    distance(from, to) {
        return this.mapAdapter.distance(from, to);
    }

    formatDistance(meters) {
        if (meters < 1000) return ${Math.floor(meters)} м;
        if (meters < 20000) return ${Math.floor(meters / 100) / 10} км;
        return ${Math.floor(meters / 1000)} км;
    }

    calculateScore(distance) {
        const max = 5000;
        return Math.max(0, Math.round(max - distance));
    }

    calculateResult({ guess, actual }) {
        if (!guess || !actual) {
            return { score: 0, distance: 0 };
        }

        const distance = this.distance(guess, actual);

        return {
            distance,
            formatted: this.formatDistance(distance),
            score: this.calculateScore(distance)
        };
    }
}
