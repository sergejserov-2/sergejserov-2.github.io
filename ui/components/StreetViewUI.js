export class StreetViewUI {
 constructor({ adapter, element }) {
  this.adapter = adapter;
  this.element = element;
  this.panorama = null;
 }

 init(position = { lat: 0, lng: 0 }) {
  if (!this.element) return;

  requestAnimationFrame(() => {
   this.panorama = this.adapter.createStreetView(
    this.element,
    position
   );
  });

this.panorama.addListener("idle", () => {
 this.onReady?.();
});
  
 }

 setLocation(pos) {
  if (!this.panorama || !pos) return;
  this.panorama.setPosition(pos);
 }

 setPov(pov) {
  if (!this.panorama || !pov) return;
  this.panorama.setPov(pov);
 }
}
