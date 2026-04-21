export class StreetViewUI {
 constructor({ adapter, element }) {
  this.adapter = adapter;
  this.element = element;

  this.panorama = null;

  // внешний сигнал для GameFlow
  this.onReady = null;
 }

 // =========================
 // INIT
 // =========================
 init(position = { lat: 0, lng: 0 }) {
  if (!this.element) return;

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

  this.panorama.setPosition(pos);

  // 🔥 ВСЯ логика готовности теперь в Adapter
  this.adapter.attachReadySignal(this.panorama, () => {
   this.onReady?.();
  });
 }

 // =========================
 // POV
 // =========================
 setPov(pov) {
  if (!this.panorama || !pov) return;
  this.panorama.setPov(pov);
 }
}
