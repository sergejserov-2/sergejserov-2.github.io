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
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.timer = services.timer;
  this.moves = services.moves;
  this.roundTimer = services.timer;

  this.mode = mode;
  this.network = network;
  this.playerId = playerId;

  this.listeners = {};

  this.locked = false;
  this.roundLocked = false;

  this.finishedPlayers = new Set();

  this._resolveStreetViewReady = null;
  this._resolveRoundStart = null;

  this._roundFinishing = false;
  this._started = false;

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

  this.network.onRoundStarted?.((data) => {
   this.startRoundFromNetwork(data);
  });

  this.network.onGuess?.((data) => {
   this.applyExternalGuess(data);
  });

  this.network.onRoundComplete?.(() => {
   this.syncRoundComplete();
  });
 }

 // =========================
 // START (ЕДИНАЯ ТОЧКА)
 // =========================
 start({ role }) {
  if (this._started) return;

  this._started = true;

  console.log("🚀 GAMEFLOW START", { role, mode: this.mode });

  this.finishedPlayers.clear();
  this.roundLocked = false;

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  // HOST или SOLO запускают раунд
  if (this.mode === "solo" || role === "host") {
   this.startRound();
  }
 }

 // =========================
 // ROUND CORE
 // =========================
 lockRoundUI() {
  this.locked = true;
  this.roundLocked = false;
  this.finishedPlayers.clear();

  this.emit("inputLocked");
  this.emit("loadingStarted");
 }

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

   this.network?.sendRoundStarted?.({ location });

   return this.startRoundWithLocation(location);
  }

  // GUEST
  const location = await this.waitForRoundFromNetwork();
  return this.startRoundWithLocation(location);
 }

 waitForRoundFromNetwork() {
  return new Promise(res => {
   this._resolveRoundStart = res;
  });
 }

 startRoundFromNetwork({ location }) {
  if (this.playerId === "p1") return;

  this._resolveRoundStart?.(location);
  this._resolveRoundStart = null;
 }

 async startRoundWithLocation(location) {
  console.log("🌍 ROUND START", location);

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
 // GUESS
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
   this.emit("inputLocked");
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

 async nextRound() {
  if (this.game.getState().status === "ended") return;
  await this.startRound();
 }
}
