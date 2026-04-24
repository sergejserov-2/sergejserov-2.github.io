export class GameFlow {
 constructor({
  game,
  generator,
  area,
  services,
  mode = "solo",
  network = null,
  playerId = "p1"
 }) {

  // =========================
  // CORE
  // =========================
  this.game = game;
  this.generator = generator;
  this.area = area;

  // =========================
  // SERVICES
  // =========================
  this.timer = services.timer;
  this.roundTimer = services.timer;
  this.moves = services.moves;

  // =========================
  // MODE / NETWORK
  // =========================
  this.mode = mode;
  this.network = network;
  this.playerId = playerId;

  // =========================
  // STATE
  // =========================
  this.listeners = {};

  this.locked = false;
  this.roundLocked = false;

  this.finishedPlayers = new Set();

  this._started = false;

  // защита от повторного старта раунда
  this._lastRoundIndex = null;

  // street view sync
  this._resolveStreetViewReady = null;

  this.bindNetwork();
 }

 // =========================================================
 // EVENTS
 // =========================================================
 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================================================
 // NETWORK (STATE-DRIVEN)
 // =========================================================
 bindNetwork() {
  if (!this.network) return;

  this.network.onRoom((room) => {
   const game = room.game;
   if (!game) return;

   // =========================
   // GAME START
   // =========================
   if (game.started && !this._started) {
    this._started = true;

    this.game.startGame();
    this.emit("gameStarted", this.game.getState());
   }

   // =========================
   // ROUND UPDATE
   // =========================
   const round = game.round;
   if (!round) return;

   if (this._lastRoundIndex === round.index) return;

   this._lastRoundIndex = round.index;

   this.startRoundFromState(round);
  });
 }

 // =========================================================
 // GAME START (SOLO + HOST)
 // =========================================================
 startGame() {
  if (this._started) return;

  this._started = true;

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  this.startRound();
 }

 // =========================================================
 // ROUND START (HOST / SOLO)
 // =========================================================
 async startRound() {
  this.lockRoundUI();

  // SOLO
  if (this.mode === "solo") {
   const location = await this.generator.generate(this.area);
   return this.startRoundWithLocation(location);
  }

  // HOST
  if (this.playerId === "p1") {
   const location = await this.generator.generate(this.area);

   const index =
    (this.game.getState().rounds?.length || 0) + 1;

   await this.network.setRound({
    index,
    location
   });

   return this.startRoundWithLocation(location);
  }
 }

 // =========================================================
 // ROUND FROM STATE (GUEST)
 // =========================================================
 startRoundFromState(round) {
  if (this.playerId === "p1") return;

  this.startRoundWithLocation(round.location);
 }

 // =========================================================
 // CORE ROUND LOGIC
 // =========================================================
 async startRoundWithLocation(location) {
  this.game.startRound(location);

  this.emit("streetViewSetLocation", location);

  await this.waitForStreetViewReady();

  this.emit("loadingFinished");

  // =========================
  // MAIN TIMER (RESTORED)
  // =========================
  this.timer.start(
   this.game.config.rules.time,
   () => this.finishRound("timeout"),
   (t) => this.emit("timerTick", t)
  );

  // =========================
  // MOVES
  // =========================
  this.moves.reset(this.game.config.rules.moves);
  this.emit("movesUpdated", this.moves.getRemaining());

 // unlock input
  this.locked = false;
  this.emit("inputUnlocked");

  this.emit("roundStarted", this.game.getState());
 }

 // =========================================================
 // STREET VIEW SYNC
 // =========================================================
 waitForStreetViewReady() {
  return new Promise(res => {
   this._resolveStreetViewReady = res;
  });
 }

 streetViewReady() {
  this._resolveStreetViewReady?.();
  this._resolveStreetViewReady = null;
 }

 // =========================================================
 // GUESS
 // =========================================================
 finishGuess(point) {
  if (this.locked) return;

  const payload = {
   playerId: this.playerId,
   guess: point
  };

  if (this.mode === "duel") {
   this.network?.updatePlayer?.(this.playerId, {
    guess: point
   });
  }

  this.applyGuess(this.playerId, point);
 }

 applyGuess(playerId, point) {
  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.game.applyResult(result);

  this.emit("guessResolved", result);

  if (this.mode === "solo") {
   this.finishRound("guess");
   return;
  }

  this.handlePlayerFinished(playerId);
 }

 // =========================================================
 // DUEL FLOW
 // =========================================================
 handlePlayerFinished(playerId) {
  this.finishedPlayers.add(playerId);

  this.locked = true;

  this.emit("inputLocked");
  this.emit("roundWaiting");

  if (this.finishedPlayers.size >= this.game.players.length) {
   this.network?.finishRound?.();
   this.finishRound("allFinished");
   return;
  }

  // duel timeout window (RESTORED)
  if (!this.roundLocked) {
   this.roundLocked = true;

   this.roundTimer.start(
    10,
    () => this.finishRound("duelTimeout"),
    (t) => this.emit("roundTimerTick", t)
   );
  }
 }

 // =========================================================
 // MOVES
 // =========================================================
 registerMove() {
  if (this.locked) return;

  const ok = this.moves.consume();

  this.emit("movesUpdated", this.moves.getRemaining());

  if (!ok || this.moves.isLocked()) {
   this.emit("movesLocked");
  }
 }

 // =========================================================
 // ROUND END
 // =========================================================
 finishRound(reason = "manual") {
  this.timer.clear();
  this.roundTimer.clear();

  this.locked = true;
  this.roundLocked = false;
  this.finishedPlayers.clear();

  this.emit("inputLocked");

  const state = this.game.getState();

  const isLast =
   state.rounds.length >= this.game.config.rules.rounds;

  this.emit("roundResultShown", { state, reason });

  if (isLast) {
   this.game.endGame();
   this.emit("gameEnded", state);
  }
 }

 // =========================================================
 // LEGACY COMPATIBILITY (IMPORTANT)
 // =========================================================
 startGameFromNetwork() {
  if (this._started) return;

  this._started = true;

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  this.startRound();
 }

 lockRoundUI() {
  this.locked = true;
  this.roundLocked = false;

  this.emit("inputLocked");
  this.emit("loadingStarted");
 }

 streetViewReady() {
  this._resolveStreetViewReady?.();
  this._resolveStreetViewReady = null;
 }
}
