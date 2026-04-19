export class StreetViewUI {
 constructor({ adapter, element }) {
  this.adapter = adapter;
  this.element = element;
  this.panorama = null;
 }

 init(initialPosition = { lat: 0, lng: 0 }) {
  if (!this.element) return;

  this.panorama = this.adapter.createStreetView(
   this.element,
   initialPosition
  );
 }

 setLocation(pos) {
  if (!this.panorama || !pos) return;
  this.panorama.setPosition(pos);
 }

 lock() {
  this.panorama?.setOptions({
   disableDefaultUI: true,
   scrollwheel: false,
   clickToGo: false
  });
 }

 unlock() {
  this.panorama?.setOptions({
   disableDefaultUI: false,
   scrollwheel: true,
   clickToGo: true
  });
 }

 reset() {
  this.unlock();
 }
}
