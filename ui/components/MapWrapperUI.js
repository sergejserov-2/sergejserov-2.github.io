
export class MapWrapperUI {
    constructor({ adapter, element, uiBuilder }) {
        this.adapter = adapter;
        this.uiBuilder = uiBuilder;
        this.element = element;

        this.map = null;

        // state
        this.isLocked = false;
        this.lastGuessPoint = null;

        // markers
        this.guessMarker = null;

        // polygon
        this.area = null;
        this.polygonId = null;
        this.polygonVisible = false;

        // callbacks
        this.onGuess = null;

        // resize
        this._resizeObserver = null;
    }

    // =========================
    // INIT
    // =========================
    init() {
        if (!this.element) return;

        this.map = this.adapter.createMap(this.element, {
            zoom: 2,
            center: { lat: 20, lng: 0 }
        });

        // 🔥 стабильный resize
        this._resizeObserver = new ResizeObserver(() => {
            this.adapter.resize(this.map);
        });

        this._resizeObserver.observe(this.element);

        // click
        this.map.on("click", (e) => {
            if (this.isLocked) return;

            const point = {
                lat: e.lngLat.lat,
                lng: e.lngLat.lng
            };

            this.lastGuessPoint = point;
            this.placeGuessMarker(point);
        });
    }

    // =========================
    // AREA
    // =========================
    setArea(area) {
        this.area = area;
    }

    getNormalizedPolygon() {
        if (!this.area?.polygon) return null;

        return this.area.polygon.map(p => [p.lng, p.lat]);
    }

    // =========================
    // POLYGON
    // =========================
    showPolygon() {
        if (!this.map || !this.area) return;

        this.hidePolygon();

        const coords = this.getNormalizedPolygon();
        if (!coords || coords.length < 3) return;

        this.polygonId = this.adapter.createPolygon(
            this.map,
            coords,
            {
                strokeColor: "#4ea1ff",
                fillColor: "#4ea1ff",
                fillOpacity: 0.2
            }
        );

        this.polygonVisible = true;
    }

    hidePolygon() {
        if (!this.polygonId) return;

        this.adapter.removePolygon(this.map, this.polygonId);

        this.polygonId = null;
        this.polygonVisible = false;
    }

    togglePolygon() {
        if (this.polygonVisible) {
            this.hidePolygon();
        } else {
            this.showPolygon();
        }
    }

    bindPolygonButton(el) {
        if (!el) return;
        el.addEventListener("click", () => this.togglePolygon());
    }

    // =========================
    // INPUT
    // =========================
    bindGuess(cb) {
        this.onGuess = cb;
    }

    bindGuessButton(el) {
        if (!el) return;

        el.addEventListener("click", () => {
            if (this.isLocked) return;
            if (!this.onGuess) return;
            if (!this.lastGuessPoint) return;

            this.onGuess(this.lastGuessPoint);
        });
    }

    // =========================
    // MARKER
    // =========================
    placeGuessMarker(point) {
        if (!this.map || !point) return;

        this.clearGuessMarker();

        const color =
            this.uiBuilder?.getPlayerColor?.("p1") ?? "#ff4d4d";

        this.guessMarker = this.adapter.createMarker(
            this.map,
            point,
            { color }
        );
    }

    clearGuessMarker() {
        if (!this.guessMarker) return;

        this.adapter.removeMarker(this.guessMarker);
        this.guessMarker = null;
    }

    // =========================
    // STATE
    // =========================
    reset() {
        this.unlock();

        this.clearGuessMarker();
        this.lastGuessPoint = null;

        this.hidePolygon();
    }

    lock() {
        this.isLocked = true;
    }

    unlock() {
        this.isLocked = false;
    }

    // =======================

==
    // DESTROY (важно для SPA)
    // =========================
    destroy() {
        this.clearGuessMarker();
        this.hidePolygon();

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        this.map?.remove?.();
        this.map = null;
    }
}
