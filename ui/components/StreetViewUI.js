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

  // 🔥 самый важный сигнал
  this.panorama.addListener("tilesloaded", resolveOnce);

  // 🔥 fallback (если tilesloaded не сработал)
  setTimeout(resolveOnce, 3000);
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






