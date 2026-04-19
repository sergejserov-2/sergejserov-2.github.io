export class MapUI {
    constructor({ element }) {
        this.root = element;

        // DOM
        this.guessMapElement = this.root.querySelector(".guess-map");
        this.streetViewElement = this.root.querySelector(".streetview");
        this.embedMapElement = this.root.querySelector(".embed-map");

        if (!this.guessMapElement || !this.streetViewElement || !this.embedMapElement) {
            throw new Error("MapUI: missing DOM nodes");
        }

        // GOOGLE STATE
        this.googleMap = null;
        this.panorama = null;

        // MARKERS
        this.guessMarker = null;
        this.overviewLines = [];

        // STATE
        this.isGuessMode = false;

        // EVENTS
        this.onGuessCallback = null;

        // resize binding guard
        this._resizeBound = false;
    }

    // =====================================================
    // ROUND LIFECYCLE
    // =====================================================

    initRound({ location }) {
        this.destroyRound();

        requestAnimationFrame(() => {

            // =========================
            // GUESS MAP
            // =========================
            this.googleMap = new google.maps.Map(this.embedMapElement, {
                center: location,
                zoom: 2,
                disableDefaultUI: true,
                clickableIcons: false
            });

            // =========================
            // STREETVIEW
            // =========================
            this.panorama = new google.maps.StreetViewPanorama(
                this.streetViewElement,
                {
                    position: location,
                    addressControl: false,
                    linksControl: true,
                    panControl: true,
                    zoomControl: false,
                    fullscreenControl: false,
                    motionTracking: false,
                    clickToGo: true,
                    scrollwheel: true
                }
            );

            this.googleMap.setStreetView(this.panorama);

            // =========================
            // CLICK HANDLER
            // =========================
            this.googleMap.addListener("click", (e) => {
                if (!this.isGuessMode) return;

                this.emitGuess({
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng()
                });
            });

            // =========================
            // RESIZE SYSTEM (WINDOW-LIKE)
            // =========================
            this.initResize();

        });
    }

    // =====================================================
    // DESTROY
    // =====================================================

    destroyRound() {
        if (this.googleMap) {
            google.maps.event.clearInstanceListeners(this.googleMap);
            this.googleMap = null;
        }

        if (this.panorama) {
            google.maps.event.clearInstanceListeners(this.panorama);
            this.panorama = null;
        }

        this.clearGuessMarker();
        this.clearOverview();
    }

    // =====================================================
    // RESIZE (WINDOW BEHAVIOR)
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
    
            // WIDTH (вправо)
            const newW = Math.max(minW, startW + dx);
    
            // HEIGHT (вверх)
            const rawH = startH - dy;
            const clampedH = Math.max(minH, rawH);
    
            // корректируем dy после clamp
            const realDy = startH - clampedH;
    
            el.style.width = `${newW}px`;
            el.style.height = `${clampedH}px`;
            el.style.top = `${startTop + realDy}px`;
    
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
        if (center) {
            this.googleMap.setCenter(center);
        }
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
    // MARKER
    // =====================================================

    placeGuessMarker(location) {
        if (!this.googleMap) return;

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
    // OVERVIEW
    // =====================================================

    renderOverview({ guess, actual }) {
        if (!this.googleMap || !guess || !actual) return;

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(guess);
        bounds.extend(actual);

        this.googleMap.fitBounds(bounds);

        const line = new google.maps.Polyline({
            path: [guess, actual],
            geodesic: true,
            strokeColor: "#ffcc00",
            strokeOpacity: 1,
            strokeWeight: 2,
            map: this.googleMap
        });

        this.overviewLines.push(line);
    }

    clearOverview() {
        for (const line of this.overviewLines) {
            line.setMap(null);
        }
        this.overviewLines = [];
    }

    // =====================================================
    // EVENTS
    // =====================================================

    onGuess(callback) {
        this.onGuessCallback = callback;
    }

    emitGuess(point) {
        if (this.onGuessCallback) {
            this.onGuessCallback(point);
        }
    }
}
