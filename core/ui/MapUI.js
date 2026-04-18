export class MapUI {
    constructor({ element }) {
        this.element = element;

        // DOM ROOTS (from new HTML)
        this.mapElement = element.querySelector(".map-element");
        this.embedMapElement = element.querySelector(".embed-map");
        this.overviewMapElement = element.querySelector(".overview-map");

        // GOOGLE MAP STATE
        this.googleMap = null;
        this.marker = null;
        this.overviewLines = [];

        this.isEmbedMode = true;

        this.polygon = null;
    }

    // INIT MAP

    initMap({ polygon } = {}) {
        this.googleMap = new google.maps.Map(this.mapElement, {
            zoom: 0,
            center: { lat: 0, lng: 0 },
            disableDefaultUI: true,
            clickableIcons: false
        });

        this.polygon = polygon;

        this.attachEmbedMap();

        this.googleMap.addListener("click", (e) => {
            if (!this.isEmbedMode) return;

            this.emitGuess(e.latLng);
        });
    }

    // MAP ATTACHING (VIEW SWITCH)

    attachEmbedMap() {
        const el = this.googleMap.getDiv();
        el.remove();
        this.embedMapElement.appendChild(el);
    }

    attachOverviewMap() {
        const el = this.googleMap.getDiv();
        el.remove();
        this.overviewMapElement.appendChild(el);
    }

    // GUESS MARKER
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

    // OVERVIEW RENDERING

    renderOverview({ guess, actual }) {
        this.attachOverviewMap();

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

        this.overviewLines.push({
            line
        });
    }

    clearOverview() {
        for (const l of this.overviewLines) {
            l.line.setMap(null);
        }

        this.overviewLines = [];
    }

    // MODE CONTROL

    enableGuessMode() {
        this.isEmbedMode = true;
        this.googleMap?.setOptions({ draggable: true });
    }

    disableGuessMode() {
        this.isEmbedMode = false;
        this.googleMap?.setOptions({ draggable: false });
    }

    lockInput() {
        this.disableGuessMode();
    }

    // FIT MAP

    fitToPositions(positions) {
        if (!positions?.length) return;

        const bounds = new google.maps.LatLngBounds();

        for (const p of positions) {
            bounds.extend(p);
        }

        this.googleMap.fitBounds(bounds);
    }

    // EVENT EMISSION (Bridge hook)
  emitGuess(latLng) {
        if (this.onGuess) {
            this.onGuess({
                lat: latLng.lat(),
                lng: latLng.lng()
            });
        }
    }

    onGuess(callback) {
        this.onGuess = callback;
    }
}
