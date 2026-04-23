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

        if (!actual) return;

        const actualColor = this.uiBuilder.getActualColor();

        // =========================
        // 🔥 НОВОЕ: нормализация guesses
        // =========================
        const guesses = round.guesses?.length
            ? round.guesses
            : (round.guess ? [round.guess] : []);

        // =========================
        // CASE: NO GUESSES
        // =========================
        if (!guesses.length) {
            this.markers.push(
                this.adapter.createMarker(this.map, actual, {
                    color: actualColor,
                    scale: 1.3
                })
            );
            return;
        }

        // =========================
        // 1. CREATE ALL GUESS MARKERS
        // =========================
        const pointsForCamera = [actual];

        for (const g of guesses) {
            const color = this.uiBuilder.getPlayerColor(g.playerId);

        this.markers.push(
          this.adapter.createMarker(this.map, {
            lat: g.lat,
            lng: g.lng
          }, {
            color,
            scale: 1
          })
        );

            pointsForCamera.push(g);
        }

        // =========================
        // 🚀 CAMERA (по всем точкам)
        // =========================
        this.fitToAll(pointsForCamera);

        await this.adapter.waitRenderStable(this.map);

        // =========================
        // 2. LINES (ПО КАЖДОМУ ИГРОКУ)
        // =========================
        for (const g of guesses) {
            const color = this.uiBuilder.getPlayerColor(g.playerId);

            await this.adapter.animateLine(
              this.map,
              {
                lat: g.lat,
                lng: g.lng
              },
              {
                lat: actual.lat,
                lng: actual.lng
              },
              color,
              actualColor
            );
        }

        // =========================
        // 3. ACTUAL MARKER (ПОСЛЕДНИЙ)
        // =========================
this.markers.push(
  this.adapter.createMarker(this.map, {
    lat: actual.lat,
    lng: actual.lng
  }, {
    color: actualColor,
    scale: 1.3
  })
);
    }

    // =========================
    // 🔥 FIT CAMERA FOR MULTI POINTS
    // =========================
    fitToAll(points) {
        if (!points.length) return;

        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLng = Infinity;
        let maxLng = -Infinity;

        for (const p of points) {
            if (p.lat < minLat) minLat = p.lat;
            if (p.lat > maxLat) maxLat = p.lat;
            if (p.lng < minLng) minLng = p.lng;
            if (p.lng > maxLng) maxLng = p.lng;
        }

        const center = {
            lat: (minLat + maxLat) / 2,
            lng: (minLng + maxLng) / 2
        };

        const dx = maxLng - minLng;
        const dy = maxLat - minLat;

        const maxDist = Math.max(dx, dy);

        let zoom = 6 - maxDist * 2.2;
        zoom = Math.max(1.5, Math.min(5.5, zoom));

        this.map.setCenter([center.lng, center.lat]);
        this.map.setZoom(zoom);
    }

    clear() {
        this.markers.forEach(m => this.adapter.removeMarker(m));
        this.markers = [];

        this.adapter.clearLines(this.map);
    }
}
