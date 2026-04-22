export class MapOverviewUI {
    constructor({ adapter, element, uiBuilder }) {
        this.adapter = adapter;
        this.uiBuilder = uiBuilder;
        this.element = element;

        this.map = null;
        this.markers = [];
    }

    init() {
        this.map = this.adapter.createMap(this.element, {
            center: { lat: 20, lng: 0 },
            zoom: 2
        });

        requestAnimationFrame(() => {
            this.adapter.resize(this.map);
        });
    }

    async render(round) {
        if (!this.map || !round) return;

        await this.adapter.waitReady(this.map);

        this.clear();

        const actual = round.actualLocation;
        const guess = round.guess;

        const playerColor = this.uiBuilder.getPlayerColor("p1");
        const actualColor = this.uiBuilder.getActualColor();

        if (!actual) return;

        // =========================
        // NO GUESS
        // =========================
        if (!guess) {
            this.adapter.fitBounds(this.map, actual, actual);

            await this.adapter.waitIdle(this.map);
            await this.adapter.waitIdle(this.map); // 🔥 DOUBLE IDLE FIX

            this.markers.push(
                this.adapter.createMarker(this.map, actual, {
                    color: actualColor,
                    scale: 1.3
                })
            );

            return;
        }

        // =========================
        // GUESS
        // =========================
        this.markers.push(
            this.adapter.createMarker(this.map, guess, {
                color: playerColor,
                scale: 1
            })
        );

        // =========================
        // CAMERA
        // =========================
        this.adapter.fitBounds(this.map, guess, actual);

        await this.adapter.waitIdle(this.map);
        await this.adapter.waitIdle(this.map); // 🔥 CRITICAL FIX

        // =========================
        // LINE
        // =========================
        await this.adapter.animateLine(
            this.map,
            guess,
            actual,
            playerColor,
            actualColor
        );

        // 🔥 LINE INVALIDATES IDLE STATE → WAIT AGAIN
        await this.adapter.waitIdle(this.map);

        // =========================
        // FINAL STABILIZATION BEFORE MARKER
        // =========================
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // =========================
        // ACTUAL
        // =========================
        this.markers.push(
            this.adapter.createMarker(this.map, actual, {
                color: actualColor,
                scale: 1.3
            })
        );
    }

    clear() {
        this.markers.forEach(m => this.adapter.removeMarker(m));
        this.markers = [];

        this.adapter.clearLines(this.map);
    }
}
