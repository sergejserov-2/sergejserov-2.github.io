export class GameFlow {
 constructor({ game, generator, area, services }) {
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.timer = services.timer;
  this.moves = services.moves;
  this.rounds = services.rounds;

  this.listeners = {};
  this.locked = false;

  this._resolveStreetViewReady = null;
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
  this.rounds.start(this.game.config.rules.rounds);

  this.emit("gameStarted", this.game.getState());

  await this.startRound();
 }

 async startRound() {
  this.locked = true;

  this.emit("inputLocked");
  this.emit("loadingStarted");

  const location = await this.generator.generate(this.area);

  this.game.startRound(location);
  this.emit("streetViewSetLocation", location);

  await this.waitForStreetViewReady();

  this.emit("loadingFinished");

  this.timer.start(
   this.game.config.rules.time,
   () => this.finishRound("timeout"),
   (t) => this.emit("timerTick", t)
  );

  this.moves.reset(this.game.config.rules.moves);

  this.locked = false;

  this.emit("inputUnlocked");
  this.emit("roundStarted", this.game.getState());
 }

 waitForStreetViewReady() {
  return new Promise(resolve => {
   this._resolveStreetViewReady = resolve;
  });
 }

 streetViewReady() {
  if (this._resolveStreetViewReady) {
   this._resolveStreetViewReady();
   this._resolveStreetViewReady = null;
  }
 }

 finishGuess(point, playerId = "p1") {
  if (this.locked) return;

  const canMove = this.moves.consume();
  this.emit("movesUpdated", this.moves.getRemaining());

  if (!canMove) {
   this.finishRound("moves");
   return;
  }

  this.locked = true;
  this.emit("inputLocked");

  this.game.setGuess(playerId, point);

  const result = this.game.finishGuess(playerId, {
   distance: 0,
   score: 0
  });

  this.emit("guessResolved", result);

  this.finishRound("guess");
 }

 finishRound(reason = "manual") {
  this.timer.clear();
  this.locked = true;

  this.emit("inputLocked");

  const state = this.game.getState();

  const playedRounds = state.rounds.length;
  const totalRounds = this.rounds.getTotal();

  const isLastRound = playedRounds >= totalRounds;

  this.game.commitRound();

  if (isLastRound) {
   this.game.endGame();
   this.emit("gameEnded", state);
   return;
  }

  this.emit("roundResultShown", {
   state,
   reason
  });
 }

 async nextRound() {
  if (this.game.isGameEnded?.()) {
   this.game.endGame();
   return;
  }

  await this.startRound();
 }
}
