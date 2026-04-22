
export class GameFlow {
 constructor({ game, generator, area, services, mode = "solo" }) {
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.timer = services.timer;
  this.moves = services.moves;

  this.listeners = {};
  this.locked = false;

  // =========================
  // MULTIPLAYER
  // =========================
  this.mode = mode;
  this.roundLocked = false;
  this.finishedPlayers = new Set();

  this._resolveStreetViewReady = null;
 }

 // =========================
 // EVENT SYSTEM
 // =========================
 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================
 // APPLY EXTERNAL STATE (future multiplayer sync)
 // =========================
 applyState(state) {
  this.game.gameState.status = state.status;
  this.game.gameState.rounds = state.rounds;

  this.emit("stateApplied", state);
 }

 // =========================
 // GAME START
 // =========================
 async startGame() {
  this.finishedPlayers.clear();
  this.roundLocked = false;

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  await this.startRound();
 }

 // =========================
 // ROUND START
 // =========================
 async startRound() {
  this.locked = true;
  this.roundLocked = false;
  this.finishedPlayers.clear();

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

 // =========================
 // STREET VIEW READY
 // =========================
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
 // GUESS (MULTIPLAYER CORE CHANGE)
 // =========================
 finishGuess(point, playerId = "p1") {
  if (this.locked || this.roundLocked) return;

  const result = this.game.setGuess(playerId, point);

  if (!result) return;

  this.emit("guessResolved", result);

  // =========================
  // SOLO MODE (старое поведение)
  // =========================
  if (this.mode === "solo") {
   this.locked = true;
   this.emit("inputLocked");
   this.finishRound("guess");
   return;
  }

  // =========================
  // DUEL MODE (новое поведение)
  // =========================
  this.finishedPlayers.add(playerId);

  this.emit("playerFinished", {
   playerId,
   state: this.game.getState()
  });

  this.locked = true;
  this.roundLocked = true;

  // 🔥 игрок уходит в waiting screen
  this.emit("inputLocked");
  this.emit("roundWaiting", {
   playerId,
   state: this.game.getState()
  });

  // ⚠️ важно:
  // НЕ завершаем раунд сразу
  // ждём остальных игроков или таймера сервера (будет позже)
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
 // ROUND END (solo + future sync point)
 // =========================
 finishRound(reason = "manual") {
  this.timer.clear();
  this.locked = true;

  this.emit("inputLocked");

  const state = this.game.getState();

  const isLast =
   state.rounds.length >= this.game.config.rules.rounds;

  this.emit("r

oundResultShown", { state, reason });

  if (isLast) {
   this.game.endGame();
   this.emit("gameEnded", this.game.getState());
   return;
  }
 }

 // =========================
 // EXTERNAL SYNC (DUEL CORE HOOK)
 // =========================
 syncRoundComplete() {
  if (!this.roundLocked) return;

  this.roundLocked = false;
  this.finishedPlayers.clear();

  this.emit("roundSyncComplete");
 }

 async nextRound() {
  if (this.game.getState().status === "ended") return;
  await this.startRound();
 }
}
