export class StreetViewUI {
 constructor({ adapter, element }) {
  this.adapter = adapter;
  this.element = element;
  this.panorama = null;

  this.isReady = false;
  this.readyCallbacks = [];
 }

 init() {
  this.panorama = this.adapter.createStreetView(this.element);

  this.isReady = true;

  this.readyCallbacks.forEach(cb => cb());
  this.readyCallbacks = [];
 }

 onReady(cb) {
  if (this.isReady) {
   cb();
  } else {
   this.readyCallbacks.push(cb);
  }
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
