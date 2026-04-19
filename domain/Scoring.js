export class Scoring {
    constructor(geometry) {
        this.geometry = geometry;
        this.MAX_SCORE = 5000;
        this.SCALE = 2000;
    }

    distance(from, to) {
        if (!from || !to) return null;
        return this.geometry.distance(from, to);
    }

    calculateScore(distanceMeters) {
        if (distanceMeters == null) return 0;
        const km = distanceMeters / 1000;
        return Math.max(0, Math.round(this.MAX_SCORE * Math.exp(-km / this.SCALE)));
    }

    calculateResult({ guess, actual }) {
        if (!guess || !actual) return { score: 0, distance: null };

        const distanceMeters = this.distance(guess, actual);
        if (distanceMeters == null) return { score: 0, distance: null };

        return {
            distance: Math.round(distanceMeters / 1000),
            score: this.calculateScore(distanceMeters)
        };
    }
}
