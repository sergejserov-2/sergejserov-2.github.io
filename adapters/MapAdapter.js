export class MapAdapter {
    constructor() {}

    // =========================
    // COORDS
    // =========================
    toLngLat(p) {
        return [p.lng, p.lat];
    }

    // =========================
    // MAP
    // =========================
    createMap(element, { center, zoom }) {
        const key = "PnzOFXp1MIxIAe8nTmbt";

        const map = new maplibregl.Map({
            container: element,
            style: `https://api.maptiler.com/maps/019db4b1-7dea-76e9-b311-977e10dcd80c/style.json?key=${key}`,
            center: this.toLngLat(center),
            zoom,
            attributionControl: false
        });

        map._isReady = false;

        map.on("load", () => {
            map._isReady = true;
        });

        return map;
    }

    async waitReady(map) {
        if (map._isReady) return;
        await new Promise(res => map.once("load", res));
    }

    waitIdle(map) {
        return new Promise(res => map.once("idle", res));
    }

    resize(map) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                map?.resize?.();
            });
        });
    }

    // =========================
    // CAMERA
    // =========================
    fitBounds(map, a, b) {
        const bounds = new maplibregl.LngLatBounds(
            this.toLngLat(a),
            this.toLngLat(b)
        );

        map.fitBounds(bounds, {
            padding: 90,
            duration: 0
        });
    }

    // =========================
    // MARKER (СТАБИЛЬНЫЙ ДОМ)
    // =========================
    createMarker(map, { lat, lng }, { color = "#ff4d4d", scale = 1 } = {}) {
        const size = 20 * scale;
        const inner = size * 0.45;

        const el = document.createElement("div");

        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.position = "relative";

        el.innerHTML = `
            <div style="
                width:${size}px;
                height:${size}px;
                position:relative;
            ">
                <div style="
                    position:absolute;
                    inset:0;
                    border-radius:50%;
                    border:2px solid ${color};
                    opacity:0.6;
                "></div>

                <div style="
                    width:${inner}px;
                    height:${inner}px;
                    background:${color};
                    border-radius:50%;
                    position:absolute;
                    left:50%;
                    top:50%;
                    transform:translate(-50%,-50%);
                "></div>
            </div>
        `;

        return new maplibregl.Marker({
            element: el,
            anchor: "center"
        })
            .setLngLat([lng, lat])
            .addTo(map);
    }

    removeMarker(marker) {
        marker?.remove?.();
    }
}
