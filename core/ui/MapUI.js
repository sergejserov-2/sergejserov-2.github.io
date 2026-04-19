[19.04.2026 7:43] Сергей Серов: export class MapUI {
    constructor() {
        // =========================
        // DOM
        // =========================
        this.embedMapElement = document.querySelector(".embed-map");
        this.overviewMapElement = document.querySelector(".overview-map");
        this.guessMapElement = document.querySelector(".guess-map");

        // =========================
        // MAP INSTANCES
        // =========================
        this.googleMap = null;
        this.overviewMap = null;

        // =========================
        // STATE
        // =========================
        this.isGuessMode = false;
        this.guessMarker = null;
        this.overviewLines = [];

        this.onGuessCallback = null;

        // resize flag
        this._resizeBound = false;

        // events
        this.initDOMEvents();
    }

    // =====================================================
    // INIT ROUND (GUESS MAP)
    // =====================================================

    initRound({ location }) {
        this.destroyRound();

        requestAnimationFrame(() => {

            this.googleMap = new google.maps.Map(this.embedMapElement, {
                center: location,
                zoom: 2,
                disableDefaultUI: true,
                clickableIcons: false
            });

            this.googleMap.addListener("click", (e) => {
                if (!this.isGuessMode) return;

                const point = {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng()
                };

                this.emitGuess(point);
            });

            this.initResize();
        });
    }

    // =====================================================
    // OVERVIEW MAP INIT
    // =====================================================

    initOverviewMap() {
        if (!this.overviewMapElement) return;

        this.overviewMap = new google.maps.Map(this.overviewMapElement, {
            zoom: 2,
            center: { lat: 0, lng: 0 },
            disableDefaultUI: true
        });
    }

    // =====================================================
    // GUESS MODE
    // =====================================================

    enableGuessMode() {
        this.isGuessMode = true;
        this.googleMap?.setOptions({ draggable: true });
    }

    disableGuessMode() {
        this.isGuessMode = false;
        this.googleMap?.setOptions({ draggable: false });
    }

    // =====================================================
    // MARKER (GUESS MAP)
    // =====================================================

    placeGuessMarker(location) {
        if (!this.googleMap || !location) return;

        this.clearGuessMarker();

        this.guessMarker = new google.maps.Marker({
            position: location,
            map: this.googleMap
        });
    }

    clearGuessMarker() {
        if (this.guessMarker) {
            this.guessMarker.setMap(null);
            this.guessMarker = null;
        }
    }

    // =====================================================
    // OVERVIEW (RESULT MAP)
    // =====================================================

    renderOverview({ guess, actual }) {
        if (!this.overviewMap || !guess || !actual) return;

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(guess);
        bounds.extend(actual);

        this.overviewMap.fitBounds(bounds);

        // markers
        new google.maps.Marker({
            position: guess,
            map: this.overviewMap
        });

        new google.maps.Marker({
            position: actual,
            map: this.overviewMap
        });

        // line
        const line = new google.maps.Polyline({
            path: [guess, actual],
            geodesic: true,
            strokeColor: "#ffcc00",
            strokeOpacity: 1,
            strokeWeight: 2,
            map: this.overviewMap
        });

        this.overviewLines.push(line);
    }
    
    clearOverview() {
        if (this.overviewLines.length) {
            this.overviewLines.forEach(l => l.setMap(null));
            this.overviewLines = [];
        }
    }

    // =====================================================
    // RESIZE SYSTEM
    // =====================================================

    initResize() {
        if (this._resizeBound) return;

        const el = this.guessMapElement;
        const handle = el.querySelector(".resize-handle");

        if (!handle) return;

        let resizing = false;
        let startX, startY, startW, startH, startTop;

        handle.addEventListener("mousedown", (e) => {
            resizing = true;

            startX = e.clientX;
            startY = e.clientY;

            const rect = el.getBoundingClientRect();

            startW = rect.width;
            startH = rect.height;
            startTop = rect.top;

            document.body.style.userSelect = "none";
        });

        window.addEventListener("mousemove", (e) => {
            if (!resizing) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const minW = 180;
            const minH = 120;

            const newW = Math.max(minW, startW + dx);
            const newH = Math.max(minH, startH - dy);

            const realDy = startH - newH;

            el.style.width = '${newW}px';
            el.style.height = '${newH}px';
            el.style.top = '${startTop + realDy}px';

            this.triggerMapResize();
        });

        window.addEventListener("mouseup", () => {
            resizing = false;
            document.body.style.userSelect = "";
        });

        this._resizeBound = true;
    }

    triggerMapResize() {
        if (!this.googleMap) return;

        google.maps.event.trigger(this.googleMap, "resize");

        const center = this.googleMap.getCenter();
        if (center) this.googleMap.setCenter(center);
    }

    // =====================================================
    // EVENTS
    // =====================================================

    onGuess(callback) {
        this.onGuessCallback = callback;
    }

    emitGuess(point) {
        this.onGuessCallback?.(point);
    }

    initDOMEvents() {
        const btn = document.getElementById("makeGuess");

        if (btn) {
            btn.addEventListener("click", () => {
                if (!this.lastGuess) return;
                this.emitGuess(this.lastGuess);
            });
        }
    }
}
