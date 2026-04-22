import { Geometry } from "../../domain/math/Geometry.js";

export class MapOverviewUI {
  constructor({ adapter, element, uiBuilder }) {
    this.adapter = adapter;
    this.uiBuilder = uiBuilder;
    this.element = element;

    this.map = null;
    this.markers = [];
    this.lines = [];

    this._resizeObserver = null;
    this._resizeRAF = null;
  }

  // =========================
  // INIT
  // =========================
  init() {
    if (!this.element) return;

    this.map = this.adapter.createMap(this.element, {
      center: { lat: 20, lng: 0 },
      zoom: 2
    });

    this._resizeObserver = new ResizeObserver(() => {
      this.scheduleResize();
    });

    this._resizeObserver.observe(this.element);
  }

  // =========================
  // RENDER
  // =========================
  render(round) {
    if (!this.map || !round) return;

    this.clear();

    const actual = round.actualLocation;
    const guess = round.guess;

    if (!actual) return;

    const playerColor = this.uiBuilder.getPlayerColor(
      guess?.playerId || "p1"
    );

    const actualColor = this.uiBuilder.getActualColor();

    // =========================
    // NO GUESS
    // =========================
    if (!guess) {
      const actualMarker = this.adapter.createMarker(this.map, actual, {
        color: actualColor,
        scale: 1.35
      });

      this.markers.push(actualMarker);

      this.fitToPoints([actual, actual]);
      return;
    }

    // =========================
    // GUESS CASE
    // =========================
    const guessMarker = this.adapter.createMarker(this.map, guess, {
      color: playerColor,
      scale: 1
    });

    this.markers.push(guessMarker);

    const segments = this.adapter.createGradientPolyline(
      null,
      [guess, actual],
      playerColor,
      actualColor,
      14
    );

    this.lines.push(...segments);

    this.fitToPoints([guess, actual]);

    this.animateSegments(segments, () => {
      const actualMarker = this.adapter.createMarker(this.map, actual, {
        color: actualColor,
        scale: 1.35
      });

      this.markers.push(actualMarker);
    });
  }

  // =========================
  // SEGMENT ANIMATION
  // =========================
  animateSegments(segments, onComplete) {
    if (!segments?.length) {
      onComplete?.();
      return;
    }

    let index = 0;
    const delay = Math.max(10, 200 / segments.length);

    const showNext = () => {
      if (index >= segments.length) {
        onComplete?.();
        return;
      }

      segments[index].setMap(this.map);

      index++;
      setTimeout(showNext, delay);
    };

    showNext();
  }

  // =========================
  // 🔥 SMOOTH CAMERA FIT
  // =========================
  fitToPoints(points, duration = 900) {
    if (!this.map || points.length < 2) return;

    const a = points[0];
    const b = points[1];

    const target = Geometry.getBounds(a, b);

    const startBounds = this.map.getBounds?.();

    let t0 = null;

    const ease = t => 1 - Math.pow(1 - t, 3);

    const step = (t) => {
      if (!t0) t0 = t;

      const p = ease(Math.min((t - t0) / duration, 1));

      const sw = startBounds?.getSouthWest?.();
      const ne = startBounds?.getNorthEast?.();

      const startMinLat = sw?.lat() ?? target.minLat;
      const startMinLng = sw?.lng() ?? target.minLng;
      const startMaxLat = ne?.lat() ?? target.maxLat;
      const startMaxLng = ne?.lng() ?? target.maxLng;

      const bounds = new google.maps.LatLngBounds(
        {
          lat: startMinLat + (target.minLat - startMinLat) * p,
          lng: startMinLng + (target.minLng - startMinLng) * p
        },
        {
          lat: startMaxLat + (target.maxLat - startMaxLat) * p,
          lng: startMaxLng + (target.maxLng - startMaxLng) * p
        }
      );

      this.map.fitBounds(bounds, 0);

      if (p < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
  // =========================
  // CLEAR
  // =========================
  clear() {
    this.markers.forEach(m => this.adapter.removeMarker(m));
    this.lines.forEach(l => l.setMap(null));

    this.markers = [];
    this.lines = [];
  }

  // =========================
  // RESIZE
  // =========================
  scheduleResize() {
    if (!this.map) return;

    if (this._resizeRAF) {
      cancelAnimationFrame(this._resizeRAF);
    }

    this._resizeRAF = requestAnimationFrame(() => {
      google.maps.event.trigger(this.map, "resize");
      this._resizeRAF = null;
    });
  }

  forceResize() {
    this.scheduleResize();
  }

  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }
}
