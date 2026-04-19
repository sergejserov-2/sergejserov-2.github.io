export class MapUI {
    constructor({ element }) {
        this.root = element;

        // DOM
        this.mapElement = this.root.querySelector(".map-element");
        this.streetViewElement = this.root.querySelector(".streetview");
        this.embedMapElement = this.root.querySelector(".embed-map");

        if (!this.mapElement || !this.streetViewElement || !this.embedMapElement) {
            throw new Error("MapUI: missing DOM nodes");
        }

        // Google instances
        this.map = null;
        this.streetView = null;

        // state
        this.isGuessMode = true;
        this.guessCallback = null;
    }

    // =====================================================
    // ROUND INIT (CALLED EVERY ROUND)
    // =====================================================

    initRound({ location }) {
        this.destroyRound();

        this.initStreetView(location);
        this.initMap();
    }

    // =====================================================
    // MAP
    // =====================================================

    initMap() {
        this.map = new google.maps.Map(this.mapElement, {
            zoom: 2,
            center: { lat: 0, lng: 0 },
            disableDefaultUI: true,
            clickableIcons: false
        });

        this.map.addListener("click", (e) => {
            if (!this.isGuessMode) return;

            this.emitGuess(e.latLng);
        });

        // ensure DOM placement
        this.embedMapElement.appendChild(this.mapElement);
    }

    // =====================================================
    // STREET VIEW
    // =====================================================

    initStreetView(location) {
        this.streetView = new google.maps.StreetViewPanorama(
            this.streetViewElement,
            {
                position: location,
                pov: { heading: 0, pitch: 0 },
                zoom: 1,
                disableDefaultUI: true
            }
        );
    }

    // =====================================================
    // GUESS
    // =====================================================

    onGuess(cb) {
        this.guessCallback = cb;
    }

    emitGuess(latLng) {
        if (!this.guessCallback) return;

        this.guessCallback({
            lat: latLng.lat(),
            lng: latLng.lng()
        });
    }

    placeGuessMarker(location) {
        if (!this.map) return;

        if (this.marker) this.marker.setMap(null);

        this.marker = new google.maps.Marker({
            position: location,
            map: this.map
        });
    }

    // =====================================================
    // OVERVIEW (RESULT SCREEN)
    // =====================================================

    renderOverview({ guess, actual }) {
        const bounds = new google.maps.LatLngBounds();

        bounds.extend(guess);
        bounds.extend(actual);

        this.map.fitBounds(bounds);

        new google.maps.Polyline({
            path: [guess, actual],
            strokeColor: "#ffcc00",
            strokeOpacity: 1,
            strokeWeight: 2,
            map: this.map
        });
    }

    // =====================================================
    // MODE
    // =====================================================

    enableGuessMode() {
        this.isGuessMode = true;
        this.map?.setOptions({ draggable: true });
    }

    disableGuessMode() {
        this.isGuessMode = false;
        this.map?.setOptions({ draggable: false });
    }

    // =====================================================
    // CLEANUP
    // =====================================================

    destroyRound() {
        if (this.marker) {
            this.marker.setMap(null);
            this.marker = null;
        }

        this.map = null;
        this.streetView = null;

        this.embedMapElement.innerHTML = "";
        this.streetViewElement.innerHTML = "";
    }
}
