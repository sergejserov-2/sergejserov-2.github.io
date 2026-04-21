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
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
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
  return new Promise(res => {
   this._resolveStreetViewReady = res;
  });
 }

 streetViewReady() {
  this._resolveStreetViewReady?.();
  this._resolveStreetViewReady = null;
 }

 // =========================
 // ГЕСС (НЕ ТРОГАЕМ ШАГИ)
 // =========================
 finishGuess(point, playerId = "p1") {
  if (this.locked) return;

  this.locked = true;
  this.emit("inputLocked");

  const result = this.game.setGuess(playerId, point);

  if (result) {
   this.emit("guessResolved", result);
  }

  this.finishRound("guess");
 }

 // =========================
 // MOVES теперь отдельным событием
 // =========================
 registerMove() {
  if (this.locked) return;

  const ok = this.moves.consume();

  this.emit("movesUpdated", this.moves.getRemaining());

  if (!ok) {
   this.finishRound("moves");
  }
 }

 finishRound(reason = "manual") {
  this.timer.clear();
  this.locked = true;

  this.emit("inputLocked");

  const state = this.game.getState();

  const isLast =
   state.rounds.length >= this.game.config.rules.rounds;

  this.emit("roundResultShown", { state, reason });

  if (isLast) {
   this.game.endGame();
   this.emit("gameEnded", this.game.getState());
   return;
  }
 }

 async nextRound() {
  if (this.game.getState().status === "ended") return;
  await this.startRound();
 }
}
