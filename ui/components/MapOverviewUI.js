export class MapOverviewUI {
    constructor({ adapter, element, uiBuilder }) {
        this.adapter = adapter;
        this.uiBuilder = uiBuilder;
        this.element = element;

        this.map = null;

        this.guessMarker = null;
        this.actualMarker = null;
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
        // PRECREATE BOTH MARKERS
        // =========================
        this.guessMarker = guess
            ? this.adapter.createMarker(this.map, guess, {
                  color: playerColor,
                  scale: 1
              })
            : null;

        this.actualMarker = this.adapter.createMarker(this.map, actual, {
            color: actualColor,
            scale: 1.3
        });

        // =========================
        // ONLY GUESS VISIBLE FIRST
        // =========================
        if (this.guessMarker) {
            this.adapter.showMarker(this.guessMarker, this.map);
        }

        // actual скрыт (НЕ добавляем в карту)
        // 👉 просто не добавляем пока

        // =========================
        // CAMERA
        // =========================
        this.adapter.fitBounds(this.map, guess || actual, actual);
        await this.adapter.waitIdle(this.map);

        // стабилизация projection
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // =========================
        // REVEAL ACTUAL
        // =========================
        this.adapter.showMarker(this.actualMarker, this.map);
    }

    clear() {
        if (this.guessMarker) this.adapter.hideMarker(this.guessMarker);
        if (this.actualMarker) this.adapter.hideMarker(this.actualMarker);

        this.guessMarker = null;
        this.actualMarker = null;
    }
}
