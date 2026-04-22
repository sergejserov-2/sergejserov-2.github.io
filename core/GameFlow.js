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

  // =========================
  // MULTIPLAYER STATE
  // =========================
  this.playersReady = new Set();
  this.waitTimer = null;
 }

 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 applyState(state) {
  this.game.gameState.status = state.status;
  this.game.gameState.rounds = state.rounds;

  this.emit("roundStarted", state);
 }

 // =========================
 // GAME FLOW
 // =========================
 async startGame() {
  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  await this.startRound();
 }

 async startRound() {
  this.locked = true;
  this.playersReady.clear();

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
  this.emit("movesUpdated", this.moves.getRemaining());

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
 // 🔥 MULTIPLAYER CORE LOGIC
 // =========================
 finishGuess(point, playerId = "p1") {
  if (this.locked) return;

  const result = this.game.setGuess(playerId, point);

  if (result) {
   this.emit("guessResolved", result);
  }

  // =========================
  // MARK PLAYER READY
  // =========================
  this.playersReady.add(playerId);

  // =========================
  // PLAYER WAIT SCREEN
  // =========================
  this.emit("playerWaiting", { playerId });

  // =========================
  // CHECK END CONDITIONS
  // =========================
  const totalPlayers = this.game.players?.length || 1;

  if (this.playersReady.size >= totalPlayers) {
   this.finishRound("all-players-ready");
   return;
  }

  // =========================
  // START WAIT TIMER FOR OTHERS
  // =========================
  if (!this.waitTimer) {
   this.emit("waitTimerStarted", { duration: 10000 });

   this.waitTimer = setTimeout(() => {
    this.finishRound("timeout-wait");
   }, 10000);
  }
 }

 // =========================
 // MOVES
 // =========================
 registerMove() {
  if (this.locked) return;

  const ok = this.moves.consume();

  this.emit("movesUpdated", this.moves.getRemaining());

  if (!ok || this.moves.isLocked()) {
   this.emit("movesLocked");
   return;
  }
 }

 // =========================
 // ROUND END
 // =========================
 finishRound(reason = "manual") {
  this.timer.clear();
  this.locked = true;

  if (this.waitTimer) {
   clearTimeout(this.waitTimer);
   this.waitTimer = null;
  }

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
