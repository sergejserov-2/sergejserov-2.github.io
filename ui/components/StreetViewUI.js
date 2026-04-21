export class StreetViewUI {
 constructor({ adapter, element }) {
  this.adapter = adapter;
  this.element = element;

  this.panorama = null;

  this.onReady = null;
  this.onMove = null;

  this.moveLocked = false;
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

  this.panorama.addListener("position_changed", () => {
   this.onMove?.();
  });
 }

 // =========================
 // LOCATION
 // =========================
 setLocation(pos) {
  if (!this.panorama || !pos) return;

  this.panorama.setPosition(pos);

  this.adapter.attachReadySignal(this.panorama, () => {
   this.onReady?.();
  });
 }

 // =========================
 // 🚫 MOVE LOCK (НОРМАЛЬНЫЙ КОНТРОЛЬ)
 // =========================
 lockMove() {
  this.moveLocked = true;

  const links = this.element.querySelectorAll("a, button");

  links.forEach(el => {
   el.style.pointerEvents = "none";
   el.style.opacity = "0.3";
  });
 }

 unlockMove() {
  this.moveLocked = false;

  const links = this.element.querySelectorAll("a, button");

  links.forEach(el => {
   el.style.pointerEvents = "auto";
   el.style.opacity = "1";
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
