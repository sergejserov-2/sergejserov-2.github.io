
export class MapAdapter {
 constructor() {
  this.map = null;
 }

 // =========================
 // COORDS
 // =========================
 toLngLat(p) {
  return [p.lng, p.lat];
 }

 fromLngLat(p) {
  return { lat: p[1], lng: p[0] };
 }

 // =========================
 // POLYLINE (GRADIENT + ANIMATION)
 // =========================
 createGradientPolyline(map, path, fromColor, toColor, steps = 60) {
  const id = `line-${Math.random().toString(36).slice(2)}`;

  const coordinates = path.map(p => this.toLngLat(p));

  // стартуем с "пустой" линии (анимация)
  const animatedData = {
   type: "Feature",
   geometry: {
    type: "LineString",
    coordinates: [coordinates[0], coordinates[0]]
   }
  };

  map.addSource(id, {
   type: "geojson",
   data: animatedData
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

    // 🔥 ГРАДИЕНТ
    "line-gradient": [
     "interpolate",
     ["linear"],
     ["line-progress"],
     0,
     fromColor,
     1,
     toColor
    ]
   }
  });

  // =========================
  // ANIMATION (progressive reveal)
  // =========================
  let i = 1;

  const step = () => {
   if (i >= coordinates.length) return;

   const partial = coordinates.slice(0, i + 1);

   const source = map.getSource(id);
   if (!source) return;

   source.setData({
    type: "Feature",
    geometry: {
     type: "LineString",
     coordinates: partial
    }
   });

   i++;

   requestAnimationFrame(step);
  };

  requestAnimationFrame(step);

  return {
   id,
   remove: () => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
   }
  };
 }
}
