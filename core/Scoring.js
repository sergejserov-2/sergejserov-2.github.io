export class Scoring {
    constructor(geometry) {
        this.geometry = geometry;
    }

    // =====================================================
    // DISTANCE (PURE GEOMETRY)
    // =====================================================

    distance(from, to) {
        return this.geometry.distance(from, to);
    }

    // =====================================================
    // FORMAT
    // =====================================================

    formatDistance(meters) {
        if (meters < 1000) return `${Math.floor(meters)} м`;
        if (meters < 20000) return `${Math.floor(meters / 100) / 10} км`;
        return `${Math.floor(meters / 1000)} км`;
    }

    // =====================================================
    // SCORE RULE
    // =====================================================

    calculateScore(distance) {
        const max = 5000;
        return Math.max(0, Math.round(max - distance));
    }

    // =====================================================
    // RESULT PIPELINE
    // =====================================================

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
