
export class MapWrapperUI {
    constructor({ adapter, element, uiBuilder }) {
        this.adapter = adapter;
        this.uiBuilder = uiBuilder;
        this.element = element;

        this.map = null;

        // state
        this.isLocked = false;
        this.lastGuessPoint = null;

        // marker
        this.guessMarker = null;

        // polygon
        this.area = null;
        this.polygonId = null;
        this.polygonVisible = false;

        // callbacks
        this.onGuess = null;
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

        // 🔥 начальный resize
        requestAnimationFrame(() => {
            this.adapter.resize(this.map);
        });

        // =========================
        // CLICK
        // =========================
        this.map.on("click", (e) => {
            if (this.isLocked) return;

            const point = {
                lat: e.lngLat.lat,
                lng: e.lngLat.lng
            };

            this.lastGuessPoint = point;
            this.placeGuessMarker(point);
        });

        // resize engine
        this.initResize();
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

    // =========================
// RESIZE ENGINE (FIXED)
    // =========================
    initResize() {
        const handle =
            this.element?.parentElement?.querySelector(".resize-handle");

        if (!handle) return;

        let startX, startY, startW, startH;
        let wrapper;
        let isDragging = false;

        let raf = null;

        const resizeMap = () => {
            if (raf) return;

            raf = requestAnimationFrame(() => {
                this.map?.resize?.();
                raf = null;
            });
        };

        handle.addEventListener("mousedown", (e) => {
            e.preventDefault();

            isDragging = true;

            wrapper = this.element.parentElement;
            const rect = wrapper.getBoundingClientRect();

            startX = e.clientX;
            startY = e.clientY;
            startW = rect.width;
            startH = rect.height;

            document.body.style.userSelect = "none";

            const onMove = (e) => {
                if (!isDragging) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                wrapper.style.width = Math.max(200, startW + dx) + "px";
                wrapper.style.height = Math.max(200, startH - dy) + "px";

                resizeMap();
            };

            const onUp = () => {
                isDragging = false;

                document.body.style.userSelect = "";

                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);

                // финальный resize
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.map?.resize?.();
                    });
                });
            };

            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        });
    }

    // =========================
    // DESTROY
    // =========================
    destroy() {
        this.clearGuessMarker();
        this.hidePolygon();

        this.map?.remove?.();
        this.map = null;
    }
}
