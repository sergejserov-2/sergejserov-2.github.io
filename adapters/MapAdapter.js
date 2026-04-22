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

    resize(map) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                map?.resize?.();
            });
        });
    }

    // =========================
    // CAMERA (СТАТИЧНАЯ)
    // =========================
    setBetween(map, a, b) {
        const lng = (a.lng + b.lng) / 2;
        const lat = (a.lat + b.lat) / 2;

        map.setCenter([lng, lat]);

        const dx = Math.abs(a.lng - b.lng);
        const dy = Math.abs(a.lat - b.lat);
        const max = Math.max(dx, dy);

        const zoom = Math.max(1.5, 6 - max * 2);

        map.setZoom(zoom);
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




async animateLine(map, start, end, colorA, colorB) {
    await new Promise(res => {
        if (map.isStyleLoaded()) return res();
        map.once("load", res);
    });

    const id = `line-${Math.random().toString(36).slice(2)}`;

    const steps = 60;

    const coords = [];

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;

        coords.push([
            start.lng + (end.lng - start.lng) * t,
            start.lat + (end.lat - start.lat) * t
        ]);
    }

    // =========================
    // SOURCE (ВАЖНО: lineMetrics)
    // =========================
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

    // =========================
    // LAYER
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

    return new Promise(resolve => {
        let i = 1;

        const animate = () => {
            const source = map.getSource(id);
            if (!source) return;

            // 🔥 защита от 1-point bug
            const slice = coords.slice(0, Math.max(i, 2));

            source.setData({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: slice
                }
            });

            i++;

            if (i <= steps) {
                requestAnimationFrame(animate);
            } else {
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
