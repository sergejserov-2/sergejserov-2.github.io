export class MapUI {
    constructor({ element }) {
        this.root = element;

        // DOM
        this.guessMapElement = this.root.querySelector(".guess-map");
        this.streetViewElement = this.root.querySelector(".streetview");
        this.embedMapElement = this.root.querySelector(".embed-map");

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
    }

    // =====================================================
    // ROUND LIFECYCLE
    // =====================================================

    initRound({ location }) {
        this.destroyRound();

        // =========================
        // MAP
        // =========================
        this.googleMap = new google.maps.Map(this.guessMapElement, {
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

        // связка (не обязательна, но полезна)
        this.googleMap.setStreetView(this.panorama);

        // =========================
        // CLICK HANDLER (guess)
        // =========================
        this.googleMap.addListener("click", (e) => {
            if (!this.isGuessMode) return;

            this.emitGuess({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            });
        });
    }

    destroyRound() {
        // MAP
        if (this.googleMap) {
            this.googleMap = null;
        }

        // STREETVIEW
        if (this.panorama) {
            google.maps.event.clearInstanceListeners(this.panorama);
            this.panorama.setVisible(false);
            this.panorama = null;
        }

        // MARKERS
        this.clearGuessMarker();
        this.clearOverview();
    }

    // =====================================================
    // GUESS MODE
    // =====================================================

    enableGuessMode() {
        this.isGuessMode = true;

        if (this.googleMap) {
            this.googleMap.setOptions({ draggable: true });
        }
    }

    disableGuessMode() {
        this.isGuessMode = false;

        if (this.googleMap) {
            this.googleMap.setOptions({ draggable: false });
        }
    }

    // =====================================================
    // GUESS MARKER
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
    // OVERVIEW (ROUND RESULT)
    // =====================================================

    renderOverview({ guess, actual }) {
        if (!this.googleMap) return;

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
