export class MapUI {
    constructor({ element }) {
        this.root = element;

        // DOM
        this.mapElement = this.root.querySelector(".map-element");
        this.embedMapElement = this.root.querySelector(".embed-map");
        this.overviewMapElement = this.root.querySelector(".overview-map");

        if (!this.mapElement || !this.embedMapElement) {
            throw new Error("MapUI: required DOM elements not found");
        }

        // GOOGLE MAP
        this.googleMap = null;
        this.marker = null;
        this.overviewLines = [];

        this.isEmbedMode = true;
        this.polygon = null;

        // EVENT HANDLER (FIXED)
        this.guessCallback = null;
    }

    // =====================================================
    // INIT
    // =====================================================

    initMap({ polygon } = {}) {
        if (!window.google?.maps) {
            throw new Error("Google Maps not ready");
        }

        this.polygon = polygon;

        // create map ONCE
        this.googleMap = new google.maps.Map(this.mapElement, {
            zoom: 2,
            center: { lat: 0, lng: 0 },
            disableDefaultUI: true,
            clickableIcons: false
        });

        // attach click
        this.googleMap.addListener("click", (e) => {
            if (!this.isEmbedMode) return;
            this.emitGuess(e.latLng);
        });
    }

    // =====================================================
    // GUESS EVENT (FIXED)
    // =====================================================

    onGuess(callback) {
        this.guessCallback = callback;
    }

    emitGuess(latLng) {
        if (!this.guessCallback) return;

        this.guessCallback({
            lat: latLng.lat(),
            lng: latLng.lng()
        });
    }

    // =====================================================
    // MARKERS
    // =====================================================

    placeGuessMarker(location) {
        if (this.marker) this.marker.setMap(null);

        this.marker = new google.maps.Marker({
            position: location,
            map: this.googleMap
        });
    }

    clearGuessMarker() {
        if (this.marker) {
            this.marker.setMap(null);
            this.marker = null;
        }
    }

    // =====================================================
    // OVERVIEW
    // =====================================================

    renderOverview({ guess, actual }) {
        this.clearOverview();
        this.clearGuessMarker();

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
    // MODE
    // =====================================================

    enableGuessMode() {
        this.isEmbedMode = true;
        this.googleMap?.setOptions({ draggable: true });
    }

    disableGuessMode() {
        this.isEmbedMode = false;
        this.googleMap?.setOptions({ draggable: false });
    }

    // =====================================================
    // FIT
    // =====================================================

    fitToPositions(positions) {
        if (!positions?.length) return;

        const bounds = new google.maps.LatLngBounds();

        for (const p of positions) {
            bounds.extend(p);
        }

        this.googleMap.fitBounds(bounds);
    }
}
