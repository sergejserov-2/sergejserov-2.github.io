export class StreetViewUI {
 constructor({ adapter, element }) {
  this.adapter = adapter;
  this.element = element;
  this.panorama = null;
 }

 init(position = { lat: 0, lng: 0 }) {
  if (!this.element) return;

  requestAnimationFrame(() => {
   this.panorama = this.adapter.create(
    this.element,
    position
   );
  });
 }

 setLocation(pos) {
  if (!this.panorama || !pos) return;
  this.adapter.setPosition(this.panorama, pos);
 }

 setPov(pov) {
  if (!this.panorama) return;
  this.adapter.setPov(this.panorama, pov);
 }
}
