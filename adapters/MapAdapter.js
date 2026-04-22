export class MapAdapter {
 constructor() {
  this.map = null;
  this.key = "PnzOFXp1MIxIAe8nTmbt";
 }

 // =========================
 // COORD CONVERSIONS
 // =========================
 toLngLat(p) {
  return [p.lng, p.lat];
 }

 fromLngLat(p) {
  return { lat: p[1], lng: p[0] };
 }

 // =========================
 // MAP INIT (MapLibre + MapTiler)
 // =========================

createMap(element, { center = { lat: 0, lng: 0 }, zoom = 2 } = {}) {
 if (!element) throw new Error("Map container missing");

 const key = this.key;

 this.map = new maplibregl.Map({
  container: element,
  style: `https://api.maptiler.com/maps/019db4a6-96e9-70d5-a214-f01c8c0ea283/style.json?key=${key}`,
  center: this.toLngLat(center),
  zoom,
  attributionControl: false
 });

 return this.map;
}

 // =========================
 // MARKER (double circle style)
 // =========================
 createMarker(map, { lat, lng }, options = {}) {
  const {
   color = "#ff4d4d",
   scale = 1
  } = options;

  const size = 28 * scale;

  const el = document.createElement("div");

  el.innerHTML = `
    <div style="
      width:${size}px;
      height:${size}px;
      position:relative;
      display:flex;
      align-items:center;
      justify-content:center;
    ">

      <!-- OUTER RING -->
      <div style="
        position:absolute;
        width:${size * 0.75}px;
        height:${size * 0.75}px;
        border-radius:50%;
        border:2px solid ${color};
        opacity:0.75;
      "></div>

      <!-- INNER DOT -->
      <div style="
        width:${size * 0.35}px;
        height:${size * 0.35}px;
        background:${color};
        border-radius:50%;
        box-shadow:
          0 0 0 3px rgba(0,0,0,0.25),
          0 0 10px rgba(0,0,0,0.25);
      "></div>

    </div>
  `;

  const marker = new maplibregl.Marker({ element: el })
   .setLngLat(this.toLngLat({ lat, lng }))
   .addTo(map);

  return marker;
 }

 removeMarker(marker) {
  marker?.remove?.();
 }

 // =========================
 // CAMERA
 // =========================
 setCenter(map, point) {
  map.setCenter(this.toLngLat(point));
 }

 setZoom(map, zoom) {
  map.setZoom(zoom);
 }

 fitBounds(map, points) {
  const bounds = new maplibregl.LngLatBounds();

  for (const p of points) {
   bounds.extend(this.toLngLat(p));
  }

  map.fitBounds(bounds, {
   padding: 80,
   duration: 0
  });
 }

 // =========================
 // POLYLINE (gradient + animation)
 // =========================
createGradientPolyline(map, path, fromColor, toColor) {
 const id = `line-${Math.random().toString(36).slice(2)}`;

 const [start, end] = path;

 // =========================
 // 🌍 GREAT CIRCLE POINTS
 // =========================
 const points = this._buildGreatCircle(start, end, 80);
 const coords = points.map(p => this.toLngLat(p));

 // =========================
 // SOURCE
 // =========================
 map.addSource(id, {
  type: "geojson",
  data: {
   type: "Feature",
   geometry: {
    type: "LineString",
    coordinates: [coords[0]] // старт с одной точки
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
    0, fromColor,
    1, toColor
   ]
  }
 });

 // =========================
 // 🎬 ANIMATION
 // =========================
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

  if (i <= coords.length) {
   requestAnimationFrame(animate);
  }
 };

 requestAnimationFrame(animate);

 return {
  id,
  remove: () => {
   if (map.getLayer(id)) map.removeLayer(id);
   if (map.getSource(id)) map.removeSource(id);
   }
 };
}

 // =========================
 // RESIZE
 // =========================
 triggerResize(map) {
  map?.resize?.();
 }
}
