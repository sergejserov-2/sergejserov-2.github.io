




export class LocationGenerator {
    constructor(mapAdapter, playArea) {
        this.map = mapAdapter;
        this.playArea = this.normalizePlayArea(playArea);

        this.polygon = this.playArea.polygon;

        if (!this.polygon) {
            throw new Error("Polygon is required");
        }

        this.bounds = this.safeGetBounds();
        this.coarseGrid = this.safeBuildCoarseGrid(0.2);

        this.fallbackMode = false;
    }

    // =====================================================
    // PUBLIC API
    // =====================================================

    async getRandomLocation(maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            const point = this.generatePoint();

            if (!this.isInsidePolygon(point)) continue;

            try {
                const ok = await this.map.hasStreetView(point.lat, point.lng);
                if (ok) return point;
            } catch (e) {
                console.warn("[Generator] StreetView error:", e);
            }
        }

        return this.fallbackSearch();
    }

    // =====================================================
    // CORE GENERATION (HIERARCHICAL GRID)
    // =====================================================

    generatePoint() {
        if (this.fallbackMode || !this.coarseGrid.length) {
            return this.randomFallbackPoint();
        }

        const cell = this.pickRandom(this.coarseGrid);

        const lat =
            cell.minLat +
            Math.random() * (cell.maxLat - cell.minLat);

        const lng =
            cell.minLng +
            Math.random() * (cell.maxLng - cell.minLng);

        // micro jitter for diversity
        return {
            lat: lat + (Math.random() - 0.5) * 0.05,
            lng: lng + (Math.random() - 0.5) * 0.05
        };
    }

    // =====================================================
    // FALLBACK SYSTEM
    // =====================================================

    fallbackSearch() {
        this.fallbackMode = true;

        console.warn("[Generator] fallbackSearch activated");

        for (let i = 0; i < 10; i++) {
            const point = this.randomFallbackPoint();

            if (this.isInsidePolygon(point)) {
                return point;
            }
        }

        console.error("[Generator] critical fallback (world random)");
        return this.randomFallbackPoint(true);
    }

    randomFallbackPoint(ignorePolygon = false) {
        const b = this.bounds;

        const point = {
            lat: b.minLat + Math.random() * (b.maxLat - b.minLat),
            lng: b.minLng + Math.random() * (b.maxLng - b.minLng)
        };

        if (!ignorePolygon && this.isInsidePolygon(point)) {
            return point;
        }

        return point;
    }

    // =====================================================
    // GRID BUILDING
    // =====================================================

    safeBuildCoarseGrid(step = 0.2) {
        try {
            const b = this.bounds;
            const cells = [];

            const latSteps = Math.ceil((b.maxLat - b.minLat) / step);
            const lngSteps = Math.ceil((b.maxLng - b.minLng) / step);

            for (let i = 0; i < latSteps; i++) {
                for (let j = 0; j < lngSteps; j++) {

                    const cell = {
                        minLat: b.minLat + i * step,
                        maxLat: b.minLat + (i + 1) * step,
                        minLng: b.minLng + j * step,
                        maxLng: b.minLng + (j + 1) * step
                    };

                    const center = {
                        lat: (cell.minLat + cell.maxLat) / 2,
                        lng: (cell.minLng + cell.maxLng) / 2
                    };

                    if (this.isInsidePolygon(center)) {
                        cells.push(cell);
                    }
                }
            }

            return cells;
        } catch (e) {
            console.warn("[Generator] grid build failed → fallback mode", e);
            this.fallbackMode = true;
            return [];
        }
    }

    // =====================================================
    // GEOMETRY SAFETY
    // =====================================================

    safeGetBounds() {
        try {
            const path = this.polygon.getPath().getArray();

            let minLat = Infinity;
            let maxLat = -Infinity;
            let minLng = Infinity;
            let maxLng = -Infinity;

            for (const p of path) {
                const lat = p.lat();
                const lng = p.lng();

                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
            }

            return { minLat, maxLat, minLng, maxLng };

        } catch (e) {
            console.error("[Generator] bounds fallback to world", e);

            return {
                minLat: -85,
                maxLat: 85,
                minLng: -180,
                maxLng: 180
            };
        }
    }

    // =====================================================
    // POLYGON CHECK
    // =====================================================

    isInsidePolygon(point) {
        try {
            return this.map.containsPoint(point, this.polygon);
        } catch {
            return false;
        }
    }

    // =====================================================
    // UTIL
    // =====================================================

    pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    normalizePlayArea(playArea) {
        if (!playArea) {
            throw new Error("PlayArea is undefined");
        }

        if (!playArea.polygon) {
            throw new Error("PlayArea must contain polygon");
        }

        return playArea;
    }
}
