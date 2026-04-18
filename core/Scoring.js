//Fix

export class Scoring {
    constructor(geometry) {
        this.geometry = geometry;
    }

    distance(from, to) {
        return this.geometry.distance(from, to);
    }


    calculateScore(distance) {
        const max = 5000;
        return Math.max(0, Math.round(max - distance));
    }

    formatDistance(meters) {
        if (meters < 1000) return `${Math.floor(meters)} м`;
        if (meters < 20000) return `${(meters / 1000).toFixed(1)} км`;
        return `${Math.floor(meters / 1000)} км`;
    }


    calculateResult({ guess, actual }) {
        if (!guess || !actual) {
            return {
                score: 0,
                distance: 0,
                formatted: "0 м"
            };
        }

        const distance = this.distance(guess, actual);

        return {
            distance,
            formatted: this.formatDistance(distance),
            score: this.calculateScore(distance)
        };
    }
}
