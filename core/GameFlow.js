export class GameFlow {
 constructor({ game, generator, area, services }) {
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.timer = services.timer;
  this.moves = services.moves;

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

  const result = this.game.setGuess(playerId, point);

  if (result) {
   this.emit("guessResolved", result);
  }

  this.finishRound("guess");
 }

finishRound(reason = "manual") {
  this.timer.clear();
  this.locked = true;

  this.emit("inputLocked");

  const isLastRound =
    this.game.getState().rounds.length >= this.game.config.rules.rounds;

  const state = this.game.getState(); // 🔥 ВАЖНО: после всех изменений

  this.emit("roundResultShown", {
    state,
    reason
  });

  if (isLastRound) {
    this.game.endGame();

    const finalState = this.game.getState(); // 🔥 актуальный финальный state

    this.emit("gameEnded", finalState);
    return;
  }
}

 async nextRound() {
  const state = this.game.getState();
  if (state.status === "ended") return;

  await this.startRound();
 }
}
