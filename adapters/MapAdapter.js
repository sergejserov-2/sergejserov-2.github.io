export class MapAdapter {
    constructor() {}

    toLngLat(p) {
        return [p.lng, p.lat];
    }

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
        map.on("load", () => (map._isReady = true));

        return map;
    }

    async waitReady(map) {
        if (map._isReady) return;
        await new Promise(res => map.once("load", res));
    }

// =========================
    // CAMERA (STABLE MANUAL VERSION)
    // =========================
    fitBetween(map, a, b) {
        if (!map || !a || !b) return;

        // 🔥 защита от null/undefined
        if (
            a.lng == null  a.lat == null 
            b.lng == null || b.lat == null
        ) return;

        // =========================
        // 1. CENTER
        // =========================
        const centerLng = (a.lng + b.lng) / 2;
        const centerLat = (a.lat + b.lat) / 2;

        // =========================
        // 2. DISTANCE
        // =========================
        const dx = Math.abs(a.lng - b.lng);
        const dy = Math.abs(a.lat - b.lat);

        const maxDist = Math.max(dx, dy);

        // =========================
        // 3. ZOOM (КЛЮЧЕВОЙ ФИКС)
        // =========================
        // чем дальше точки — тем меньше zoom
        let zoom = 6 - maxDist * 2.2;

        // clamp (ВАЖНО)
        zoom = Math.max(1.5, Math.min(5.5, zoom));

        // =========================
        // 4. APPLY
        // =========================
        map.setCenter([centerLng, centerLat]);
        map.setZoom(zoom);
    }

    // =========================
    // STABILITY HELPER
    // =========================
    waitRenderStable(map) {
        return new Promise(resolve => {
            let frames = 0;

            const tick = () => {
                frames++;

                // даём 2 кадра WebGL стабилизации
                if (frames >= 2) return resolve();

                requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
        });
    }

    // =========================
    // RESIZE (как у тебя)
    // =========================
    resize(map) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                map?.resize?.();
            });
        });
    }

    // =========================
    // MARKER
    // =========================
    createMarker(map, { lat, lng }, { color = "#ff4d4d", scale = 1 } = {}) {
        const size = 20 * scale;
        const inner = size * 0.45;

        const el = document.createElement("div");

        el.style.width = `${size}px`;
        el.style.height = `${size}px`;

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

animateLine(map, start, end, colorA, colorB) {
    const id = `line-${Math.random().toString(36).slice(2)}`;

    const steps = 80;

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
        lineMetrics: true,
        data: {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [coords[0]]
            }
        }
    });

    map.addLayer({
        id,
        type: "line",
        source: id,
        layout: {
            "line-cap": "round",
            "line-join": "round"
        },
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

    return new Promise(resolve => {
        let i = 1;

        const animate = () => {
            const source = map.getSource(id);
            if (!source) return;

            const safeIndex = Math.min(i, coords.length - 1);

            source.setData({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: coords.slice(0, safeIndex + 1)
                }
            });

            i++;

            if (i <= steps) {
                requestAnimationFrame(animate);
            } else {
                // 🔥 ЖЁСТКО фиксируем финальную точку
                source.setData({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: coords
                    }
                });

                resolve();
            }
        };

        requestAnimationFrame(animate);
    });
}

clearLines(map) {
    for (const layer of map.getStyle().layers || []) {
        if (layer.id.startsWith("line-")) {
            if (map.getLayer(layer.id)) map.removeLayer(layer.id);
            if (map.getSource(layer.id)) map.removeSource(layer.id);
        }
    }
}

    
}
