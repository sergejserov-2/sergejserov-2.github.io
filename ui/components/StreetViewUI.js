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

  // 🔥 move listener — сразу после создания
  this.panorama.addListener("position_changed", () => {
   this.onMove?.();
  });

  // 🔥 ready сигнал — один раз
  this.adapter.attachReadySignal(this.panorama, () => {
   this.onReady?.();
  });
 }

 // =========================
 // LOCATION
 // =========================
 setLocation(pos) {
  if (!this.panorama || !pos) return;

  this.panorama.setPosition(pos);
 }

 // =========================
 // POV
 // =========================
 setPov(pov) {
  if (!this.panorama || !pov) return;
  this.panorama.setPov(pov);
 }
}
