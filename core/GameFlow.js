export class GameFlow {
 constructor({ game, generator, area }) {
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.listeners = {};
  this.locked = false;
 }

 on(event, cb) {
  if (!this.listeners[event]) this.listeners[event] = [];
  this.listeners[event].push(cb);
 }

 emit(event, data) {
  const list = this.listeners[event];
  if (!list) return;
  list.forEach(cb => cb(data));
 }

 async startGame() {
  this.game.startGame();

  this.emit("gameStarted", this.game.getState());

  await this.startRound();
 }

 async startRound() {
  this.locked = true;
  this.emit("inputLocked");

  const location = await this.generator.generate(this.area);

  this.game.startRound(location);

  this.locked = false;

  this.emit("inputUnlocked");
  this.emit("roundStarted", this.game.getState());
  this.emit("stateUpdated", this.game.getState());
 }

 finishGuess(point, playerId = "p1") {
  if (this.locked) return;

  this.locked = true;
  this.emit("inputLocked");

  this.game.setGuess(playerId, point);
  const result = this.game.finishGuess(playerId);

  this.emit("roundEnded", this.game.getState());
  this.emit("stateUpdated", this.game.getState());

  setTimeout(() => this.nextRound(), 10000);

  return result;
 }

 async nextRound() {
  this.game.commitRound();

  if (this.game.isGameEnded()) {
   this.endGame();
   return;
  }

  await this.startRound();
 }

 endGame() {
  this.game.endGame();
  this.emit("gameEnded", this.game.getState());
 }
}
