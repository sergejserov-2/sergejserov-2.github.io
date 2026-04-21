export class StreetViewUI {
 constructor({ adapter, element }) {
  this.adapter = adapter;
  this.element = element;

  this.panorama = null;

  this.onReady = null;
  this.onMove = null;
 }

 // =========================
 // INIT
 // =========================
 init(position = { lat: 0, lng: 0 }) {
  if (!this.element) return;

  this.panorama = this.adapter.createStreetView(
   this.element,
   position
  );

  if (!this.panorama) return;

  // 🔥 шаги
  this.panorama.addListener("position_changed", () => {
   this.onMove?.();
  });
 }

 // =========================
 // LOCATION (🔥 ВАЖНО)
 // =========================
 setLocation(pos) {
  if (!this.panorama || !pos) return;

  this.panorama.setPosition(pos);

  // 🔥 ВОТ ГДЕ ДОЛЖЕН БЫТЬ READY
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
