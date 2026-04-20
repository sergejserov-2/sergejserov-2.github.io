export class MapOverviewUI {
 constructor({ adapter, element, uiBuilder }) {
  this.adapter = adapter;
  this.uiBuilder = uiBuilder;

  this.element = element;
  this.map = null;

  this.markers = [];
  this.lines = [];
 }

 init() {
  if (!this.element) return;

  this.map = this.adapter.createMap(this.element, { zoom: 2 });
 }

 render(round) {
  if (!this.map) return;

  const guessObj = round?.guesses?.[0];
  const guess = guessObj?.guess;
  const actual = round?.actualLocation;

  if (!guess || !actual) return;

  this.clear();

  const playerId = guessObj?.playerId || "p1";
  const color = this.uiBuilder.getPlayerColor(playerId);

  const guessMarker = this.adapter.createMarker(this.map, guess, {
   color,
   size: 20
  });

  const actualMarker = this.adapter.createMarker(this.map, actual, {
   color: this.uiBuilder.getActualColor(),
   size: 30
  });

  const line = this.adapter.createPolyline(this.map, [guess, actual], {
   color
  });

  this.adapter.fitToMarkers(this.map, [guessMarker, actualMarker]);

  this.markers.push(guessMarker, actualMarker);
  this.lines.push(line);

  setTimeout(() => {
   google.maps.event.trigger(this.map, "resize");
  }, 100);
 }

 clear() {
  this.lines.forEach(l => l.setMap(null));
  this.markers.forEach(m => this.adapter.removeMarker(m));

  this.lines = [];
  this.markers = [];
 }
}
