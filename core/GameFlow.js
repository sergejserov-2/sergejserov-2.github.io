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
  // CORE DOMAIN
  // =========================
  this.game = game;
  this.generator = generator;
  this.area = area;

  // =========================
  // SERVICES (НЕ ТЕРЯЕМ)
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
  // STATE FLAGS
  // =========================
  this.listeners = {};

  this.locked = false;
  this.roundLocked = false;

  this.finishedPlayers = new Set();

  this._started = false;
  this._roundFinishing = false;

  // =========================
  // NETWORK BUFFER (FIX GUEST)
  // =========================
  this._resolveRoundStart = null;
  this._pendingRoundLocation = null;

  this._resolveStreetViewReady = null;

  this.bindNetwork();
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
 // NETWORK BIND
 // =========================
 bindNetwork() {
  if (!this.network) return;

  this.network.onRoundStarted?.((data) => {
   this.startRoundFromNetwork(data);
  });

  this.network.onGuess?.((data) => {
   this.applyExternalGuess(data);
  });

  this.network.onRoundComplete?.(() => {
   this.syncRoundComplete();
  });

  this.network.onStart?.(() => {
   this.startGameFromNetwork();
  });
 }

 // =========================
 // =========================
 // 🧠 CONTRACT: START GAME
 // =========================
 // =========================

 // HOST ENTRY POINT
 startGame() {
  if (this._started) return;

  this._started = true;

  console.log("🚀 GAMEFLOW START (HOST)");

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  this.finishedPlayers.clear();
  this.roundLocked = false;

  this.startRound();
 }

 // GUEST ENTRY POINT
 startGameFromNetwork() {
  if (this._started) return;

  this._started = true;

  console.log("🚀 GAMEFLOW START (GUEST)");

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  this.finishedPlayers.clear();
  this.roundLocked = false;

  // guest НЕ стартует раунд сам
 }

 // =========================
 // ROUND START
 // =========================
 async startRound() {
  this.lockRoundUI();

  // SOLO
  if (this.mode === "solo") {
   const location = await this.generator.generate(this.area);
   return this.startRoundWithLocation(location);
  }

  // HOST = источник истины
  if (this.playerId === "p1") {
   const location = await this.generator.generate(this.area);

   this.network?.sendRoundStarted?.({ location });

   return this.startRoundWithLocation(location);
  }

  // GUEST = ждёт сеть
  const location = await this.waitForRoundFromNetwork();

  return this.startRoundWithLocation(location);
 }

 // =========================
 // NETWORK ROUND BUFFER (FIX)
 // =========================
 waitForRoundFromNetwork() {
  return new Promise((resolve) => {
   this._resolveRoundStart = resolve;

   if (this._pendingRoundLocation) {
    resolve(this._pendingRoundLocation);
    this._pendingRoundLocation = null;
    this._resolveRoundStart = null;
   }
  });
 }

 startRoundFromNetwork({ location }) {
  if (this.playerId === "p1") return;

  if (!this._resolveRoundStart) {
   this._pendingRoundLocation = location;
   return;
  }

  this._resolveRoundStart(location);
  this._resolveRoundStart = null;
 }

 // =========================
 // ROUND INIT
 // =========================
 async startRoundWithLocation(location) {
  this.game.startRound(location);

  this.emit("streetViewSetLocation", location);

  await this.waitForStreetViewReady();

  this.emit("loadingFinished");

 // =========================
  // TIMER (SERVICE)
  // =========================
  this.timer.start(
   this.game.config.rules.time,
   () => this.finishRound("timeout"),
   (t) => this.emit("timerTick", t)
  );

  // =========================
  // MOVES (SERVICE)
  // =========================
  this.moves.reset(this.game.config.rules.moves);

  this.emit("movesUpdated", this.moves.getRemaining());

  this.locked = false;

  this.emit("inputUnlocked");
  this.emit("roundStarted", this.game.getState());
 }

 // =========================
 // STREET VIEW SYNC
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
 // GUESS SYSTEM
 // =========================
 finishGuess(point) {
  if (this.locked || this.roundLocked) return;

  const payload = {
   playerId: this.playerId,
   guess: point
  };

  if (this.mode === "duel") {
   this.network?.sendGuess?.(payload);
  }

  this.applyGuess(this.playerId, point);
 }

 applyGuess(playerId, point) {
  if (this.roundLocked) return;

  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.game.applyResult(result);

  this.emit("guessResolved", result);

  if (this.mode === "solo") {
   this.locked = true;
   this.finishRound("guess");
   return;
  }

  this.handlePlayerFinished(playerId);
 }

 applyExternalGuess({ playerId, guess }) {
  if (this.locked) return;
  this.applyGuess(playerId, guess);
 }

 // =========================
 // DUEL FLOW
 // =========================
 handlePlayerFinished(playerId) {
  this.finishedPlayers.add(playerId);

  this.locked = true;

  this.emit("inputLocked");
  this.emit("roundWaiting");

  if (this.finishedPlayers.size >= this.game.players.length) {
   this.network?.sendRoundComplete?.();
   this.finishRound("allFinished");
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
 // MOVES SERVICE HOOK
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
 // ROUND END
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
 // SYNC
 // =========================
 syncRoundComplete() {
  this.roundLocked = false;
  this.finishedPlayers.clear();

  this.emit("roundSyncComplete");
 }

 // =========================
 // NEXT ROUND
 // =========================
 nextRound() {
  if (this.game.getState().status === "ended") return;
  return this.startRound();
 }
}
