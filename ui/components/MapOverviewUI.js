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

        if (!actual) return;

        const playerColor = this.uiBuilder.getPlayerColor("p1");
        const actualColor = this.uiBuilder.getActualColor();

        // =========================
        // БЕЗ GUESS
        // =========================
        if (!guess) {
            this.adapter.fitBounds(this.map, actual, actual);

            this.markers.push(
                this.adapter.createMarker(this.map, actual, {
                    color: actualColor,
                    scale: 1.3
                })
            );
            return;
        }

        // =========================
        // 1. КАМЕРА СРАЗУ
        // =========================
        this.adapter.fitBounds(this.map, guess, actual);

        await this.adapter.waitIdle(this.map);

        // =========================
        // 2. GUESS
        // =========================
        this.markers.push(
            this.adapter.createMarker(this.map, guess, {
                color: playerColor
            })
        );

        // =========================
        // 3. LINE
        // =========================
        await this.adapter.animateLine(
            this.map,
            guess,
            actual,
            playerColor,
            actualColor
        );

        // =========================
        // 4. ACTUAL
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
