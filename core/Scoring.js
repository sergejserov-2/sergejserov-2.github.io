export class Scoring {
    constructor(geometry) {
        this.geometry = geometry;

        // балансировка игры
        this.MAX_SCORE = 5000;
        this.SCALE = 2000; // чем больше — тем мягче падение
    }

    // =====================================================
    // DISTANCE (safe wrapper)
    // =====================================================

    distance(from, to) {
        if (!from || !to) return null;

        return this.geometry.distance(from, to);
    }

    // =====================================================
    // SCORE CURVE
    // =====================================================

    calculateScore(distanceMeters) {
        if (distanceMeters == null) return 0;

        const distanceKm = distanceMeters / 1000;

        // экспоненциальное падение
        const score = this.MAX_SCORE * Math.exp(-distanceKm / this.SCALE);

        return Math.max(0, Math.round(score));
    }

    // =====================================================
    // MAIN RESULT
    // =====================================================

    calculateResult({ guess, actual }) {
        if (!guess || !actual) {
            return {
                score: 0,
                distance: null
            };
        }

        // защита координат
        if (
            guess.lat == null ||
            guess.lng == null ||
            actual.lat == null ||
            actual.lng == null
        ) {
            return {
                score: 0,
                distance: null
            };
        }

        // Google
