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

      this.fitToPoints([actual, actual], false);
      return;
    }

    // =========================
    // GUESS EXISTS
    // =========================

    const guessMarker = this.adapter.createMarker(this.map, guess, {
      color: playerColor,
      scale: 1
    });

    this.markers.push(guessMarker);

    // 🔥 ВАЖНО: сначала фиксируем камеру БЕЗ анимации
    this.fitToPoints([guess, actual], false);

    const segments = this.adapter.createGradientPolyline(
      null,
      [guess, actual],
      playerColor,
      actualColor,
      14
    );

    this.lines.push(...segments);

    // 🔥 анимация линии
    this.animateSegments(segments, () => {
      const actualMarker = this.adapter.createMarker(this.map, actual, {
        color: actualColor,
        scale: 1.35
      });

      this.markers.push(actualMarker);

      // 🔥 финальный мягкий zoom после появления actual
      this.fitToPoints([guess, actual], true);
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
    const delay = Math.max(10, 180 / segments.length);

    const showNext = () => {
      if (index >= segments.length) {
        onComplete?.();
        return;
      }

      const segment = segments[index];
      segment.setMap(this.map);

      index++;
      setTimeout(showNext, delay);
    };

    showNext();
  }

  // =========================
  // CAMERA CONTROL
  // =========================
  fitToPoints(points, animate = true) {
    if (!this.map || points.length < 2) return;

    const a = points[0];
    const b = points[1];

    const bounds = new google.maps.LatLngBounds(
      { lat: Math.min(a.lat, b.lat), lng: Math.min(a.lng, b.lng) },
      { lat: Math.max(a.lat, b.lat), lng: Math.max(a.lng, b.lng) }
    );

    if (!animate) {
      this.map.fitBounds(bounds, 80);
      return;
    }

    this.animateBounds(bounds, 650);
  }

  // =========================
  // SMOOTH ZOOM ANIMATION
  // =========================
  animateBounds(targetBounds, duration = 650) {
    const map = this.map;
    if (!map) return;

    const start = map.getBounds();
    if (!start) {
      map.fitBounds(targetBounds);
      return;
    }

    const sw0 = start.getSouthWest();
    const ne0 = start.getNorthEast();

    const sw1 = targetBounds.getSouthWest();
    const ne1 = targetBounds.getNorthEast();

    let startTime = null;

    const ease = t => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const p = ease(Math.min((timestamp - startTime) / duration, 1));

      const bounds = new google.maps.LatLngBounds(
        {
          lat: sw0.lat() + (sw1.lat() - sw0.lat()) * p,
          lng: sw0.lng() + (sw1.lng() - sw0.lng()) * p
        },
        {
          lat: ne0.lat() + (ne1.lat() - ne0.lat()) * p,
          lng: ne0.lng() + (ne1.lng() - ne0.lng()) * p
        }
      );

      map.fitBounds(bounds, 0);

      if (p < 1) requestAnimationFrame(step);
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

  // =========================
  // DESTROY
  // =========================
  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }
}
