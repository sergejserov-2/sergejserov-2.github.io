export class MapWrapperUI {
    constructor({ adapter, element, uiBuilder }) {
        this.adapter = adapter;
        this.uiBuilder = uiBuilder;
        this.element = element;

        this.map = null;
        this.guessMarker = null;
        this.isLocked = false;

        this.onGuess = null;
        this.lastGuessPoint = null;

        this.area = null;

        this.polygon = null;
        this.polygonVisible = false;

        this._resizeObserver = null;
    }

    init() {
        this.map = this.adapter.createMap(this.element, {
            zoom: 2,
            center: { lat: 20, lng: 0 }
        });

        // 🔥 стабильный resize всегда
        this._resizeObserver = new ResizeObserver(() => {
            this.adapter.resize(this.map);
        });

        this._resizeObserver.observe(this.element);

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

    setArea(area) {
        this.area = area;
    }

    placeGuessMarker(point) {
        this.clearGuessMarker();

        this.guessMarker = this.adapter.createMarker(
            this.map,
            point,
            {
                color: this.uiBuilder.getPlayerColor("p1")
            }
        );
    }

    clearGuessMarker() {
        if (!this.guessMarker) return;

        this.adapter.removeMarker(this.guessMarker);
        this.guessMarker = null;
    }

    reset() {
        this.unlock();
        this.clearGuessMarker();
        this.lastGuessPoint = null;
    }

    lock() {
        this.isLocked = true;
    }

    unlock() {
        this.isLocked = false;
    }
}
