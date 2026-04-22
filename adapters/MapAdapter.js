
import { Geometry } from "../../domain/math/Geometry.js";

export class MapAdapter {
    constructor() {
        this.map = null;

        this._lines = new Set();
        this._polygons = new Set();
    }

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

        this.map = new maplibregl.Map({
            container: element,
            style: `https://api.maptiler.com/maps/019db4b1-7dea-76e9-b311-977e10dcd80c/style.json?key=${key}`,
            center: this.toLngLat(center),
            zoom,
            attributionControl: false
        });

        return this.map;
    }

    resize(map) {
        // 🔥 двойной rAF — must have для MapLibre
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                map?.resize?.();
            });
        });
    }

    // =========================
    // MARKER (2 круга)
    // =========================
    
createMarker(map, { lat, lng }, { color = "#ff4d4d", scale = 1 } = {}) {
    const size = 22 * scale;
    const inner = size * 0.4;

    const el = document.createElement("div");

    // базовый контейнер
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.position = "relative";

    // 🔥 один div + псевдоэлементы
    el.style.setProperty("--color", color);
    el.style.setProperty("--inner", `${inner}px`);

    el.style.cssText += `
        display:block;
    `;

    // создаём стиль один раз (или можно вынести в CSS)
    if (!document.getElementById("marker-style")) {
        const style = document.createElement("style");
        style.id = "marker-style";

        style.innerHTML = `
        .custom-marker {
            position: relative;
        }

        .custom-marker::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 2px solid var(--color);
            box-sizing: border-box;
        }

        .custom-marker::after {
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

    el.className = "custom-marker";

    return new maplibregl.Marker({
        element: el,
        anchor: "center"
    })
        .setLngLat(this.toLngLat({ lat, lng }))
        .addTo(map);
}

    removeMarker(marker) {
        marker?.remove?.();
    }

    // =========================
    // POLYGON (🔥 НОВОЕ)
    // =========================
    createPolygon(map, coords, {
        strokeColor = "#4ea1ff",
        fillColor = "#4ea1ff",
        fillOpacity = 0.2
    } = {}) {

        const id = `polygon-${Math.random().toString(36).slice(2)}`;

        map.addSource(id, {
            type: "geojson",
            data: {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [coords] // [[lng,lat]]
                }
            }
        });

        // fill
        map.addLayer({
            id: `${id}-fill`,
            type: "fill",
            source: id,
            paint: {
                "fill-color": fillColor,
                "fill-opacity": fillOpacity
            }
        });

        // stroke
        map.addLayer({
            id: `${id}-line`,
            type: "line",
            source: id,
            paint: {
                "line-color": strokeColor,
                "line-width": 2
            }
        });

        this._polygons.add(id);

        return id;
    }

    removePolygon(map, id) {
        if (!id) return;

        const fillId = `${id}-fill`;
        const lineId = `${id}-line`;

        if (map.getLayer(fillId)) map.removeLayer(fillId);
        if (map.getLayer(lineId)) map.removeLayer(lineId);

        if (map.getSource(id)) map.removeSource(id);

        this._polygons.delete(id);
    }

    clearPolygons(map) {
        this._polygons.forEach(id => {
            this.removePolygon(map, id);
        });
    }

    // =========================
    // LINES
    // =========================
    clearLines(map) {
        this._lines.forEach(id => {
            if (map.getLayer(id)) map.removeLayer(id);

if (map.getSource(id)) map.removeSource(id);
        });

        this._lines.clear();
    }

    // =========================
    // ANIMATION (gradient + camera)
    // =========================
    animateLine(map, start, end, colorA, colorB) {
        const id = `line-${Math.random().toString(36).slice(2)}`;

        const steps = Math.min(
            120,
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
            lineMetrics: true // 🔥 критично
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

                const t = i / steps;

                source.setData({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: coords.slice(0, i)
                    }
                });

                // 🔥 синхронная камера
                this.updateCamera(map, start, end, t);

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

    // =========================
    // CAMERA
    // =========================
    updateCamera(map, a, b, t) {
        const center = {
            lng: (a.lng + b.lng) / 2,
            lat: (a.lat + b.lat) / 2
        };

        const dx = Math.abs(a.lng - b.lng);
        const dy = Math.abs(a.lat - b.lat);
        const span = Math.max(dx, dy);

        const zoom =
            6 -
            span * 1.3 -
            t * 2.2;

        map.jumpTo({
            center: [center.lng, center.lat],
            zoom: Math.max(1.4, zoom)
        });
    }
}
