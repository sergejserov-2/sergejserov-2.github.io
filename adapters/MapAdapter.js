
import { Geometry } from "../domain/math/Geometry.js";

export class MapAdapter {
    constructor() {
        this._lines = new Set();
    }

    // =========================
    // COORDS
    // =========================
    toLngLat(p) {
        return [p.lng, p.lat];
    }

    fromLngLat(p) {
        return { lng: p[0], lat: p[1] };
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

    // 🔥 важно: даёт стабильный рендер после любых изменений
    waitRenderStable(map) {
        return new Promise(resolve => {
            let frames = 0;

            const tick = () => {
                frames++;
                if (frames >= 2) {
                    resolve();
                    return;
                }
                requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
        });
    }

    resize(map) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                map?.resize?.();
            });
        });
    }

    // =========================
    // CAMERA (простая и стабильная)
    // =========================
    fitBounds(map, a, b) {
        const bounds = new maplibregl.LngLatBounds(
            this.toLngLat(a),
            this.toLngLat(b)
        );

        map.fitBounds(bounds, {
            padding: 90,
            duration: 0 // 🔥 никаких анимаций
        });
    }

    // =========================
    // MARKER (100% стабильный)
    // =========================
    createMarker(map, { lat, lng }, { color = "#ff4d4d", scale = 1 } = {}) {
        const size = 20 * scale;
        const inner = size * 0.45;

        const el = document.createElement("div");
        el.className = "map-marker";

        el.style.width = `${size}px`;
        el.style.height = `${size}px`;

        el.style.setProperty("--color", color);
        el.style.setProperty("--inner", `${inner}px`);

        if (!document.getElementById("marker-style")) {
            const style = document.createElement("style");
            style.id = "marker-style";
            style.innerHTML = `
                .map-marker {
                    position: relative;
                }

                .map-marker::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 2px solid var(--color);
                    opacity: 0.6;
                    box-sizing: border-box;
                }

                .map-marker::after {
                    content: "";
                    position: absolute;
                    width: var(--inner);
                    height: var(--inner);
                    background: var(--color);
                    border-radius: 50%;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
            `;
            document.head.appendChild(style);
        }

        return new maplibregl.Marker({
            element: el,
            anchor: "center" // 🔥 критично для стабильности
        })
            .setLngLat(this.toLngLat({ lat, lng }))
            .addTo(map);
    }

    removeMarker(marker) {
        marker?.remove?.();
    }

    // =========================
    // LINES
    //

=========================
    clearLines(map) {
        this._lines.forEach(id => {
            if (map.getLayer(id)) map.removeLayer(id);
            if (map.getSource(id)) map.removeSource(id);
        });
        this._lines.clear();
    }

    // =========================
    // LINE ANIMATION
    // =========================
    animateLine(map, start, end, colorA, colorB) {
        const id = `line-${Math.random().toString(36).slice(2)}`;

        const steps = Math.min(
            80,
            Geometry.getSegmentsCount(
                Geometry.distance(start, end)
            )
        );

        const coords = [];

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;

            coords.push([
                start.lng + (end.lng - start.lng) * t,
                start.lat + (end.lat - start.lat) * t
            ]);
        }

        map.addSource(id, {
            type: "geojson",
            data: {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [coords[0]]
                }
            },
            lineMetrics: true
        });

        map.addLayer({
            id,
            type: "line",
            source: id,
            paint: {
                "line-width": 3,
                "line-gradient": [
                    "interpolate",
                    ["linear"],
                    ["line-progress"],
                    0, colorA,
                    1, colorB
                ]
            }
        });

        this._lines.add(id);

        return new Promise(resolve => {
            let i = 1;

            const animate = () => {
                const source = map.getSource(id);
                if (!source) return;

                source.setData({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: coords.slice(0, i)
                    }
                });

                i++;

                if (i <= steps) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            animate();
        });
    }
}
