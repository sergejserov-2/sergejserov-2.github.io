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

  const resolve = () => {
    if (resolved) return;
    resolved = true;
    this.onReady?.();
  };

  // 🔥 основной сигнал (реальный Google event)
  const idleListener = this.panorama.addListener("idle", resolve);

  // применяем позицию
  this.panorama.setPosition(pos);

  // 🔥 страховка 1
  setTimeout(resolve, 1500);
}
  // =========================
  // POV
  // =========================
  setPov(pov) {
    if (!this.panorama || !pov) return;
    this.panorama.setPov(pov);
  }
}
