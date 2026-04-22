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

  // 🔥 отдельный таймер раунда (reuse сервиса)
  this.roundTimer = services.timer;

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
 // APPLY EXTERNAL STATE
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
 // GUESS
 // =========================
 finishGuess(point, playerId = "p1") {
  if (this.locked || this.roundLocked) return;

  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.emit("guessResolved", result);

  // =========================
  // SOLO MODE
  // =========================
  if (this.mode === "solo") {
   this.locked = true;
   this.emit("inputLocked");
   this.finishRound("guess");
   return;
  }

  // =========================
  // DUEL MODE
  // =========================
  this.finishedPlayers.add(playerId);

  this.emit("playerFinished", {
   playerId,
   state: this.game.getState()
  });

  // 🔒 блокируем только текущего игрока
  this.locked = true;

  this.emit("inputLocked");
  this.emit("roundWaiting", {
   playerId,
   state: this.game.getState()
  });

  // =========================
  // ВСЕ ИГРОКИ ЗАКОНЧИЛИ
  // =========================
  if (this.finishedPlayers.size >= this.game.players.length) {
   this.finishRound("allPlayersFinished");
   return;
  }

  // =========================
  // 🔥 СТАРТ 10 СЕК ТАЙМЕРА
  // =========================
  if (!this.roundLocked) {
   this.roundLocked = true;

   this.roundTimer.start(
    10,
    () => this.finishRound("duelTimeout"),
    (t) => this.emit("roundTimerTick", t)
   );
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
  this.roundTimer.clear();

  this.locked = true;

  this.emit("inputLocked");

  const state = this.game.getState();

  const isLast =
   state.rounds.length >= this.game.config.rules.rounds;

  // ✅ ФИКС БАГА
  this.emit("roundResultShown", { state, reason });

  if (isLast) {
   this.game.endGame();
   this.emit("gameEnded", this.game.getState());
   return;
  }
 }

 // =========================
 // EXTERNAL SYNC
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
