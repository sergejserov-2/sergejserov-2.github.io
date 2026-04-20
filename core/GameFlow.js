export class GameFlow {
 constructor({ game, generator, area }) {
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.listeners = {};
  this.locked = false;
  this.currentLocation = null;
 }

 on(event, cb) {
  if (!this.listeners[event]) {
   this.listeners[event] = [];
  }
  this.listeners[event].push(cb);
 }

 emit(event, data) {
  const list = this.listeners[event];
  if (!list) return;
  list.forEach(cb => cb(data));
 }

 startGame() {
  this.game.reset();

  this.emit("gameStarted", this.game.getViewModel());

  this.startRound();
 }

 startRound() {
  this.currentLocation = this.generator.generate(this.area);

  this.locked = false;
  this.emit("inputUnlocked");

  this.emit("roundStarted", {
   round: this.game.state.currentRound
  });
 }

 finishGuess(point) {
  if (this.locked) return;

  this.locked = true;
  this.emit("inputLocked");

  const result = this.game.finishGuess(
   this.currentLocation,
   point
  );

  this.emit("roundEnded", result);
  this.emit("stateUpdated", this.game.getViewModel());

  setTimeout(() => {
   this.nextRound();
  }, 3000);
 }

 nextRound() {
  if (this.game.isFinished()) {
   this.endGame();
   return;
  }

  this.startRound();
 }

 endGame() {
  this.emit("gameEnded", this.game.getViewModel());
 }
}
