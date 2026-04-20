export class MapAdapter {
  constructor() {
    this.polylines = [];
    this.markers = [];
  }

  createMap(element, options) {
    return new google.maps.Map(element, options);
  }

  createMarker(map, position, { color, size }) {
    const marker = new google.maps.Marker({
      position,
      map
    });

    this.markers.push(marker);
    return marker;
  }

  removeMarker(marker) {
    marker.setMap(null);
  }

  // =========================
  // PURE RENDER ONLY
  // =========================

  createGradientPolyline(map, path, colorA, colorB) {
    const segments = [];

    if (!path || path.length < 2) return [];

    for (let i = 0; i < path.length - 1; i++) {
      const t = i / (path.length - 1);

      const segment = new google.maps.Polyline({
        path: [path[i], path[i + 1]],
        strokeColor: this.mixColors(colorA, colorB, t),
        strokeOpacity: 0.9,
        strokeWeight: 3,
        map
      });

      segments.push(segment);
    }

    this.polylines.push(...segments);

    return segments;
  }

  mixColors(c1, c2, t) {
    const a = this.hexToRgb(c1);
    const b = this.hexToRgb(c2);

    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const b2 = Math.round(a.b + (b.b - a.b) * t);

    return `rgb(${r},${g},${b2})`;
  }

  hexToRgb(hex) {
    const clean = hex.replace("#", "");
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16)
    };
  }
}
