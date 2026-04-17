export class LocationGenerator {
    constructor(mapAdapter, playArea) {
        this.map = mapAdapter;
        this.playArea = playArea;

        this.resetSearch();
    }

    // =====================================================
    // PUBLIC API
    // =====================================================

    async getRandomLocation() {
        this.resetSearch();

        const candidates = this.generateCandidates(12);

        const valid = await this.validateCandidates(candidates);

        if (valid) return valid;

        return this.fallbackSearch(20);
    }

    // =====================================================
    // FAST CANDIDATE GENERATION
    // =====================================================

    generateCandidates(count = 12) {
        const result = [];

        for (let i = 0; i < count * 3; i++) {
            const point = this.randomPointInSearchArea();

            if (this.map.containsPoint(point, this.playArea.polygon)) {
                result.push(point);
            }

            if (result.length >= count) break;
        }

        return result;
    }

    // =====================================================
    // PARALLEL VALIDATION
    // =====================================================

    async validateCandidates(candidates) {
        const checks = candidates.map(point =>
            this.map.hasStreetView(point.lat, point.lng)
                .then(ok => (ok ? point : null))
                .catch(() => null)
        );

        const results = await Promise.all(checks);

        return results.find(Boolean) || null;
    }

    // =====================================================
    // FALLBACK (SAFE SEQUENTIAL MODE)
    // =====================================================

    async fallbackSearch(maxAttempts = 20) {
        for (let i = 0; i < maxAttempts; i++) {
            const point = this.randomPointInSearchArea();

            const inside = this.map.containsPoint(point, this.playArea.polygon);
            if (!inside) continue;

            const ok = await this.map.hasStreetView(point.lat, point.lng);
            if (ok) return point;
        }

        throw new Error("No valid location found");
    }

    // =====================================================
    // SEARCH SPACE
    // =====================================================

    randomPointInSearchArea() {
        const { center, radiusLat, radiusLng } = this.searchState;

        return {
            lat: center.lat + (Math.random() * 2 - 1) * radiusLat,
            lng: center.lng + (Math.random() * 2 - 1) * radiusLng
        };
    }

    resetSearch() {
        this.searchState = {
            center: this.getAreaCenter(this.playArea.bounds),
            radiusLat: this.getLatRadius(this.playArea.bounds),
            radiusLng: this.getLngRadius(this.playArea.bounds)
        };
    }

    // =====================================================
    // GEOMETRY HELPERS
    // =====================================================

    getAreaCenter(bounds) {
        return {
            lat: (bounds.minLat + bounds.maxLat) / 2,
            lng: (bounds.minLng + bounds.maxLng) / 2
        };
    }

    getLatRadius(bounds) {
        return (bounds.maxLat - bounds.minLat) / 2;
    }

    getLngRadius(bounds) {
        return (bounds.maxLng - bounds.minLng) / 2;
    }
}
