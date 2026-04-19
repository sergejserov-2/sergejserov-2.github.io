export class StreetViewUI {
 constructor({ adapter, element }) {
  this.adapter = adapter;
  this.element = element;
  this.panorama = null;
 }

 init(position) {
  this.panorama = this.adapter.createStreetView(
   this.element,
   position
  );
 }

 setLocation([lat, lng]) {
  if (!this.panorama) return;
  this.panorama.setPosition({ lat, lng });
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
