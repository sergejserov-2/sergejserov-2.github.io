export class MapOverviewUI {
 constructor({ adapter, element, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;
  this.element = element;

  this.map = null;
  this.markers = [];
  this._resizeObserver = null;
 }

 init() {
  this.map = this.adapter.createMap(this.element, {
   center: { lat: 20, lng: 0 },
   zoom: 2
  });

  this._resizeObserver = new ResizeObserver(() => {
   this.adapter.resize(this.map);
  });

  this._resizeObserver.observe(this.element);
 }

 async render(round) {
  if (!this.map || !round) return;

  this.clear();

  const actual = round.actualLocation;
  const guess = round.guess;

  if (!actual) return;

  const playerColor = this.uiBuilder.getPlayerColor("p1");
  const actualColor = this.uiBuilder.getActualColor();

  // нет guess
  if (!guess) {
   this.markers.push(
    this.adapter.createMarker(this.map, actual, {
     color: actualColor,
     scale: 1.3
    })
   );
   return;
  }

  // guess
  this.markers.push(
   this.adapter.createMarker(this.map, guess, {
    color: playerColor
   })
  );

  // 🔥 АНИМАЦИЯ (теперь с камерой)
  await this.adapter.animateLine(
   this.map,
   guess,
   actual,
   playerColor,
   actualColor
  );

  // actual
  this.markers.push(
   this.adapter.createMarker(this.map, actual, {
    color: actualColor,
    scale: 1.3
   })
  );
 }

 clear() {
  this.markers.forEach(m => this.adapter.removeMarker(m));
  this.markers = [];

  this.adapter.clearLines(this.map);
 }
}
