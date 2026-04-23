export class GameFlow {
 constructor({
  game,
  generator,
  area,
  services,
  mode = "solo",
  network = null
 }) {
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.timer = services.timer;
  this.moves = services.moves;

  this.roundTimer = services.timer;

  this.mode = mode;
  this.network = network;

  this.listeners = {};

  this.locked = false;
  this.roundLocked = false;

  this.finishedPlayers = new Set();

  this._resolveStreetViewReady = null;

  this._roundFinishing = false;

  this.bindNetwork();
 }

 // =========================
 // EVENTS
 // =========================
 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================
 // NETWORK
 // =========================
 bindNetwork() {
  if (!this.network) return;

  this.network.onGuess?.((data) => {
   this.applyExternalGuess(data);
  });

  this.network.onRoundComplete?.(() => {
   this.syncRoundComplete();
  });
 }

 // =========================
 // START GAME
 // =========================
 async startGame() {
  this.finishedPlayers.clear();
  this.roundLocked = false;

  this.game.startGame();

  this.emit("gameStarted", this.game.getState());

  await this.startRound();
 }

 // =========================
 // START ROUND
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

  // TIMER (solo + duel)
  this.timer.start(
   this.game.config.rules.time,
   () => this.finishRound("timeout"),
   (t) => this.emit("timerTick", t)
  );

  // MOVES
  this.moves.reset(this.game.config.rules.moves);
  this.emit("movesUpdated", this.moves.getRemaining());

  this.locked = false;

  this.emit("inputUnlocked");
  this.emit("roundStarted", this.game.getState());
 }

 // =========================
 // STREET VIEW
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
 // GUESS ENTRY
 // =========================
 finishGuess(point, playerId = "p1") {
  if (this.locked || this.roundLocked) return;

  const payload = { playerId, guess: point };

  if (this.mode === "duel") {
   this.network?.sendGuess?.(payload);
  }

  this.applyGuess(playerId, point);
 }

 // =========================
 // APPLY GUESS (SOURCE OF TRUTH)
 // =========================
 applyGuess(playerId, point) {
  if (this.roundLocked) return;

  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.game.applyResult(result);

  this.emit("guessResolved", result);

  if (this.mode === "solo") {
   this.locked = true;
   this.emit("inputLocked");
   this.finishRound("guess");
   return;
  }

  this.handlePlayerFinished(playerId);
 }

 // =========================
 // EXTERNAL GUESS (DUEL SYNC)
 // =========================
 applyExternalGuess({ playerId, guess }) {
  if (this.locked) return;

  this.applyGuess(playerId, guess);
 }

 // =========================
 // DUEL FLOW
 // =========================
 handlePlayerFinished(playerId) {
  this.finishedPlayers.add(playerId);

  this.emit("playerFinished", {
   playerId,
   state: this.game.getState()
  });

  this.locked = true;
  this.emit("inputLocked");
  this.emit("roundWaiting");

  if (this.finishedPlayers.size >= this.game.players.length) {
   this.network?.sendRoundComplete?.();
   this.finishRound("allPlayersFinished");
   return;
  }

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
  }
 }

 // =========================
 // ROUND END (SAFE)
 // =========================
 finishRound(reason = "manual") {
  if (this._roundFinishing) return;
  this._roundFinishing = true;

  this.timer.clear();
  this.roundTimer.clear();

  this.locked = true;
  this.roundLocked = false;

  this.emit("inputLocked");

  const state = this.game.getState();

  const isLast =
   state.rounds.length >= this.game.config.rules.rounds;

  this.emit("roundResultShown", { state, reason });

  if (isLast) {
   this.game.endGame();
   this.emit("gameEnded", this.game.getState());
  }

  this._roundFinishing = false;
 }

 // =========================
 // SYNC ROUND COMPLETE
 // =========================
 syncRoundComplete() {
  this.roundLocked = false;
  this.finishedPlayers.clear();

  this.emit("roundSyncComplete");
 }

 async nextRound() {
  if (this.game.getState().status === "ended") return;
  await this.startRound();
 }
}
