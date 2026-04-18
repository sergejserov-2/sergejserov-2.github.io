export class Math {
    
    calculateScore(distance) {
        const max = 5000;
        return Math.max(0, Math.round(max - distance));
    }

    calculateResult({ guess, actual, time }) {
        if (!guess || !actual) {
            return { score: 0, distance: 0 };
        }

        const distance = this.distance(guess, actual);
        const score = this.calculateScore(distance);

        return {
            distance,
            formatted: this.formatDistance(distance),
            score
        };
    }
}
