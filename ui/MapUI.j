export class MapUI {
    constructor({ adapter, mapElement, overviewElement }) {
        this.adapter = adapter;
        this.mapElement = mapElement;
        this.overviewElement = overviewElement;

        this.map = null;
        this.overviewMap = null;

        this.guessMarker = null;
        this.overviewMarkers = [];
        this.overviewLines = [];

        this.isGuessLocked = false;
        this.onGuessCallback = null;
    }

    init() {
        this.map = this.adapter.createMap(this.mapElement, { zoom: 2 });
        this.overviewMap = this.adapter.createMap(this.overviewElement, { zoom: 2 });

        this.map.addListener("click", (e) => {
            if (this.isGuessLocked) return;

            const point = [e.latLng.lat(), e.latLng.lng()];
            this.placeGuessMarker(point);

            this.onGuessCallback?.(point);
        });
    }

    placeGuessMarker([lat, lng]) {
        if (!this.map) return;

        this.clearGuessMarker();

        this.guessMarker = this.adapter.createMarker(this.map, [lat, lng]);
    }

    clearGuessMarker() {
        if (!this.guessMarker) return;

        this.adapter.removeMarker(this.guessMarker);
        this.guessMarker = null;
    }

    lock() {
        this.isGuessLocked = true;
    }

    reset() {
        this.isGuessLocked = false;
        this.clearGuessMarker();
        this.clearOverview();
    }

    renderOverview(round) {
        const guess = round.guesses?.[0]?.guess;
        const actual = round.actualLocation;

        if (!this.overviewMap || !guess || !actual) return;

        this.clearOverview();

        const guessMarker = this.adapter.createMarker(this.overviewMap, guess);
        const actualMarker = this.adapter.createMarker(this.overviewMap, actual);

        const line = new google.maps.Polyline({
            path: [
                { lat: guess[0], lng: guess[1] },
                { lat: actual[0], lng: actual[1] }
            ],
            geodesic: true,
            strokeOpacity: 1,
            strokeWeight: 2,
            map: this.overviewMap
        });

        this.adapter.fitToMarkers(this.overviewMap, [guessMarker, actualMarker]);

        this.overviewMarkers.push(guessMarker, actualMarker);
        this.overviewLines.push(line);
    }

    clearOverview() {
        this.overviewLines.forEach(l => l.setMap(null));
        this.overviewMarkers.forEach(m => this.adapter.removeMarker(m));

        this.overviewLines = [];
        this.overviewMarkers = [];
    }

    onGuess(cb) {
        this.onGuessCallback = cb;
    }
}
