export class MapUI {
    constructor({ element } = {}) {

        // =====================================================
        // DOM (SAFE)
        // =====================================================
        this.embedMapElement = document.querySelector(".embed-map");
        this.overviewMapElement = document.querySelector(".overview-map");
        this.streetViewElement = document.querySelector(".streetview");
        this.guessMapElement = document.querySelector(".guess-map");

        if (!this.embedMapElement) {
            console.error("[MapUI] embedMapElement missing");
        }

        // =====================================================
        // MAP INSTANCES
        // =====================================================
        this.googleMap = null;
        this.overviewMap = null;
        this.panorama = null;

        // =====================================================
        // STATE
        // =====================================================
        this.isGuessLocked = false;
        this.isGuessMode = false;

        this.lastGuess = null;
        this.guessMarker = null;

        this.overviewLines = [];

        this.onGuessCallback = null;

        this._resizeBound = false;

        // ❗ DO NOT INIT GOOGLE MAPS HERE
        // Init is now lifecycle-driven from Init.js / Bridge flow
    }

    // =====================================================
    // INIT (CALLED ONCE FROM INIT.JS)
    // =====================================================

    initGuessMap() {
        if (this.googleMap || !this.embedMapElement) return;

        this.googleMap = new google.maps.Map(this.embedMapElement, {
            center: { lat: 0, lng: 0 },
            zoom: 2,
            disableDefaultUI: true,
            clickableIcons: false
        });

        this.googleMap.addListener("click", (e) => {
            if (!this.isGuessMode || this.isGuessLocked) return;

            const point = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };

            this.lastGuess = point;

            this.onGuessCallback?.(point);
        });

        this.initResize();
    }

    initOverviewMap() {
        if (this.overviewMap || !this.overviewMapElement) return;

        this.overviewMap = new google.maps.Map(this.overviewMapElement, {
            center: { lat: 0, lng: 0 },
            zoom: 2,
            disableDefaultUI: true
        });
    }

    // =====================================================
    // STREETVIEW LIFECYCLE (FIXED)
    // =====================================================

    initStreetView() {
        if (this.panorama || !this.streetViewElement) return;

        this.panorama = new google.maps.StreetViewPanorama(
            this.streetViewElement,
            {
                position: { lat: 0, lng: 0 },
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

        // bind map
        this.googleMap?.setStreetView(this.panorama);
    }

    setStreetViewLocation(location) {
        if (!this.panorama || !location) return;

        this.panorama.setPosition(location);

        // IMPORTANT: ensure render
        setTimeout(() => {
            google.maps.event.trigger(this.panorama, "resize");
        }, 100);
    }

    // =====================================================
    // ROUND FLOW API (USED BY BRIDGE)
    // =====================================================

    beginRound({ location }) {
        this.isGuessMode = true;
        this.isGuessLocked = false;

        this.clearGuessMarker();
        this.clearOverview();

        // MAP
        if (this.googleMap) {
            this.googleMap.setCenter(location);
            this.googleMap.setZoom(2);
        }

        // STREETVIEW (SAFE LIFECYCLE)
        if (!this.panorama) {
            this.initStreetView();
        }

        this.setStreetViewLocation(location);
    }

    // =====================================================
    // GUESS SYSTEM
    // =====================================================

    updateGuessPreview(point) {
        if (!this.googleMap || !point) return;

        this.clearGuessMarker();

        this.guessMarker = new google.maps.Marker({
            position: point,
            map: this.googleMap
        });
    }

    placeGuessMarker(location) {
        if (!this.googleMap || !location) return;

        this.clearGuessMarker();

        this.guessMarker = new google.maps.Marker({
            position: location,
            map: this.googleMap
        });
    }

    lockGuess() {
        this.isGuessLocked = true;
        this.isGuessMode = false;
    }

    // =====================================================
    // OVERVIEW
    // =====================================================

    renderOverview({ guess, actual }) {
        if (!this.overviewMap || !guess || !actual) return;

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(guess);
        bounds.extend(actual);

        this.overviewMap.fitBounds(bounds);

        new google.maps.Marker({
            position: guess,
            map: this.overviewMap
        });

        new google.maps.Marker({
            position: actual,
            map: this.overviewMap
        });

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
        this.overviewLines.forEach(l => l.setMap(null));
        this.overviewLines = [];
    }

    clearGuessMarker() {
        if (this.guessMarker) {
            this.guessMarker.setMap(null);
            this.guessMarker = null;
        }
    }

    // =====================================================
    // RESIZE (UNCHANGED BUT SAFE)
    // =====================================================

    initResize() {
        if (this._resizeBound || !this.guessMapElement) return;

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

            const newW = Math.max(180, startW + dx);
            const newH = Math.max(120, startH - dy);

            const realDy = startH - newH;

            el.style.width = `${newW}px`;
            el.style.height = `${newH}px`;
            el.style.top = `${startTop + realDy}px`;
        });

        window.addEventListener("mouseup", () => {
            resizing = false;
            document.body.style.userSelect = "";
        });

        this._resizeBound = true;
    }

    // =====================================================
    // EVENTS
    // =====================================================

    onGuess(cb) {
        this.onGuessCallback = cb;
    }
}
