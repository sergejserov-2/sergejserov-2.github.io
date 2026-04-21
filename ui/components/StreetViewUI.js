export class StreetViewUI {
 constructor({ adapter, element }) {
  this.adapter = adapter;
  this.element = element;
  this.panorama = null;
 }

 init(position = { lat: 0, lng: 0 }) {
  if (!this.element) return;

  this.panorama = this.adapter.createStreetView(
    this.element,
    position
  );

  if (!this.panorama) return;

  let resolved = false;

  const resolveOnce = () => {
    if (resolved) return;
    resolved = true;
    this.onReady?.();
  };

setLocation(pos) {
  if (!this.panorama || !pos) return;
  let resolved = false;
  const resolveOnce = () => {
    if (resolved) return;
    resolved = true;
    this.onReady?.();
  };

  const listener = this.panorama.addListener("position_changed", () => {
    resolveOnce();
    google.maps.event.removeListener(listener);
  });

  this.panorama.setPosition(pos);
  setTimeout(resolveOnce, 2000);
}

 setPov(pov) {
  if (!this.panorama || !pov) return;
  this.panorama.setPov(pov);
 }
}






