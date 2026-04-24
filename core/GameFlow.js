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
  this.roundTimer = services.timer;
  this.moves = services.moves;

  this.mode = mode;
  this.network = network;
  this.playerId = playerId;

  this.listeners = {};

  this.locked = false;
  this.roundLocked = false;

  this.finishedPlayers = new Set();

  this._started = false;

  this._resolveStreetViewReady = null;

  this._resolveRoundStart = null;

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

  this.network.onStart?.(() => {
   this.startGameFromNetwork();
  });
 }

 // =========================
 // GAME START
 // =========================
 startGame() {
  if (this._started) return;

  this._started = true;

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  this.startRound();
 }

 startGameFromNetwork() {
  if (this._started) return;

  this._started = true;

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());
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

  // HOST
  if (this.playerId === "p1") {
   const location = await this.generator.generate(this.area);

   const roundIndex =
    (this.game.getState().rounds?.length || 0) + 1;

   await this.network?.setRound({
    index: roundIndex,
    location,
    status: "running"
   });

   return this.startRoundWithLocation(location);
  }

  // GUEST
  const location = await this.waitForRoundFromNetwork();
  return this.startRoundWithLocation(location);
 }

 // =========================
 // NETWORK ROUND SYNC
 // =========================
 startRoundFromNetwork({ location }) {
  if (this.playerId === "p1") return;

  if (!location) return;

  this.startRoundWithLocation(location);
 }

 waitForRoundFromNetwork() {
  return new Promise((resolve) => {
   this._resolveRoundStart = resolve;
  });
 }

 // =========================
 // CORE ROUND
 // =========================
 async startRoundWithLocation(location) {

  this.game.startRound(location);

  this.emit("streetViewSetLocation", location);

  await this.waitForStreetViewReady();

  this.timer.start(
   this.game.config.rules.time,
   () => this.finishRound("timeout"),
   (t) => this.emit("timerTick", t)
  );

  this.moves.reset(this.game.config.rules.moves);

  this.locked = false;

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
 // MOVES (FIXED)
 // =========================
 registerMove() {
  if (this.locked) return;

  const ok = this.moves.consume();

  this.emit("movesUpdated", this.moves.getRemaining());

  if (!ok) {
   this.locked = true;
   this.emit("movesLocked");
  }
 }

 // =========================
 // GUESS
 // =========================
 finishGuess(point) {
  if (this.locked) return;

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
  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.game.applyResult(result);

  this.emit("guessResolved", result);

  this.handlePlayerFinished(playerId);
 }

 applyExternalGuess({ playerId, guess }) {
  this.applyGuess(playerId, guess);
 }

 // =========================
 // DUEL CONTROL
 // =========================
 handlePlayerFinished(playerId) {
  this.finishedPlayers.add(playerId);

  this.locked = true;

  this.emit("inputLocked");

  if (this.finishedPlayers.size >= this.game.players.length) {
   this.network?.sendRoundComplete?.();
   this.finishRound("allFinished");
  }
 }

 // =========================
 // ROUND END
 // =========================
 finishRound(reason = "manual") {

  this.timer.clear();
  this.roundTimer.clear();

  this.locked = true;
  this.finishedPlayers.clear();

  const state = this.game.getState();

  const isLast =
   state.rounds.length >= this.game.config.rules.rounds;

  this.emit("roundResultShown", { state, reason });

  if (isLast) {
   this.game.endGame();
   this.emit("gameEnded", state);
  }
 }

 // =========================
 // SYNC
 // =========================
 syncRoundComplete() {
  this.finishedPlayers.clear();
 }

 // =========================
 // LEGACY UI HOOK
 // =========================
 lockRoundUI() {
  this.locked = true;
  this.finishedPlayers.clear();

  this.emit("inputLocked");
  this.emit("loadingStarted");
 }
}
