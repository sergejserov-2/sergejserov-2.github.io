export class StreetViewUI {
  constructor({ adapter, element }) {
    this.adapter = adapter;
    this.element = element;

    this.panorama = null;

    // 🔥 внешний колбэк (связывается с GameFlow)
    this.onReady = null;
  }

  // =========================
  // INIT
  // =========================
  init(position = { lat: 0, lng: 0 }) {
    if (!this.element) return;

    // важно: дождаться layout
    requestAnimationFrame(() => {
      this.panorama = this.adapter.createStreetView(
        this.element,
        position
      );
    });
  }

  // =========================
  // LOCATION
  // =========================
  setLocation(pos) {
    if (!this.panorama || !pos) return;

    let resolved = false;

    const resolveOnce = () => {
      if (resolved) return;
      resolved = true;

      if (this.onReady) {
        this.onReady();
      }
    };

    // 🔥 основной сигнал — смена позиции
    const listener = this.panorama.addListener(
      "position_changed",
      () => {
        resolveOnce();
        google.maps.event.removeListener(listener);
      }
    );

    // применяем позицию
    this.panorama.setPosition(pos);

    // 🔥 fallback (если Google не прислал событие)
    setTimeout(resolveOnce, 2000);
  }

  // =========================
  // POV
  // =========================
  setPov(pov) {
    if (!this.panorama || !pov) return;
    this.panorama.setPov(pov);
  }
}
