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

    calculateResult({ guess, actual }) {
        if (!guess || !actual) {
            return {
                score: 0,
                distance: 0
            };
        }

        const distance = this.distance(guess, actual);

        return {
            distance,
            score: this.calculateScore(distance)
        };
    }
}
