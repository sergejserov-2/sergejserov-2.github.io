import { Geometry } from "../domain/math/Geometry.js";

export class MapAdapter {
    constructor() {}

    toLngLat(p) {
        return [p.lng, p.lat];
    }
    
    createMap(element, { center, zoom }) {
        const key = "PnzOFXp1MIxIAe8nTmbt";

        const map = new maplibregl.Map({
            container: element,
            style: `https://api.maptiler.com/maps/019db70f-cecb-7876-b3f6-cb59013b8d1d/style.json?key=${key}`,
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
            a.lng == null || a.lat == null ||
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
        const inner = size * 0.75;

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

    // =========================
    // 1. BUILD GREAT CIRCLE
    // =========================
    const points = Geometry.buildGreatCircle(start, end, 80);

    let coords = points.map(p => [p.lng, p.lat]);

    // =========================
    // 2. FIX DATELINE (КРИТИЧНО)
    // =========================
    coords = this._fixDateline(coords);

    // =========================
    // 3. SOURCE
    // =========================
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

    // =========================
    // 4. LAYER
    // =========================
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

    // =========================
    // 5. ANIMATION
    // =========================
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

            if (i <= coords.length) {
                requestAnimationFrame(animate);
            } else {
                // финальное состояние
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


_fixDateline(coords) {
    const fixed = [coords[0]];

    for (let i = 1; i < coords.length; i++) {
        let [lng, lat] = coords[i];
        let [prevLng] = fixed[i - 1];

        let diff = lng - prevLng;

        if (diff > 180) lng -= 360;
        if (diff < -180) lng += 360;

        fixed.push([lng, lat]);
    }

    return fixed;
}

    

clearLines(map) {
    for (const layer of map.getStyle().layers || []) {
        if (layer.id.startsWith("line-")) {
            if (map.getLayer(layer.id)) map.removeLayer(layer.id);
            if (map.getSource(layer.id)) map.removeSource(layer.id);
        }
    }
}


createPolygon(map, coords, {
    strokeColor = "#4ea1ff",
    fillColor = "#4ea1ff",
    fillOpacity = 0.2
} = {}) {

    const id = `poly-${Math.random().toString(36).slice(2)}`;

    map.addSource(id, {
        type: "geojson",
        data: {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [coords]
            }
        }
    });

    map.addLayer({
        id,
        type: "fill",
        source: id,
        paint: {
            "fill-color": fillColor,
            "fill-opacity": fillOpacity
        }
    });

    map.addLayer({
        id: id + "-stroke",
        type: "line",
        source: id,
        paint: {
            "line-color": strokeColor,
            "line-width": 2
        }
    });

    return {
        id,
        remove: () => {
            if (map.getLayer(id + "-stroke")) map.removeLayer(id + "-stroke");
            if (map.getLayer(id)) map.removeLayer(id);
            if (map.getSource(id)) map.removeSource(id);
        }
    };
}
removePolygon(map, polygon) {
    if (!map || !polygon) return;

    const { id } = polygon;

    if (!id) return;

    if (map.getLayer(id + "-stroke")) {
        map.removeLayer(id + "-stroke");
    }

    if (map.getLayer(id)) {
        map.removeLayer(id);
    }

    if (map.getSource(id)) {
        map.removeSource(id);
    }
}
    
}
