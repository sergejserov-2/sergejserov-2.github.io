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

  // ===== ROUND SYNC =====
  this._pendingRound = null;
  this._roundReady = true;

  this.bindNetwork();
 }

 // =========================
 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================
 bindNetwork() {
  if (!this.network) return;

  this.network.onRoom?.((state) => {
   const round = state.game?.round;

   if (round && round.location) {
    this.startRoundFromNetwork(round);
   }

   if (state.game?.started && !this._started) {
    this.startGameFromNetwork();
   }
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

 this.finishedPlayers.clear();
 this.roundLocked = false;

 // 🔥 FIX: ОБЯЗАТЕЛЬНЫЙ ROUND START
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

  let location;

  if (this.mode === "solo") {
   location = await this.generator.generate(this.area);
   return this.startRoundWithLocation(location);
  }

  if (this.playerId === "p1") {
   location = await this.generator.generate(this.area);

   const roundIndex =
    (this.game.getState().rounds?.length || 0) + 1;

   this.network?.setRound({
    index: roundIndex,
    location,
    status: "running"
   });

   return this.startRoundWithLocation(location);
  }

  // guest waits
 }

 // =========================
 // NETWORK ROUND
 // =========================
 startRoundFromNetwork(round) {

  if (this.playerId === "p1") return;

  if (!round?.location) return;

  this.startRoundWithLocation(round.location);
 }

 // =========================
 // CORE ROUND
 // =========================
 async startRoundWithLocation(location) {

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
 // GUESS
 // =========================
 finishGuess(point) {
  if (this.locked) return;

  const payload = {
   playerId: this.playerId,
   guess: point
  };

  this.network?.sendGuess?.(payload);

  this.applyGuess(this.playerId, point);
 }

 applyGuess(playerId, point) {

  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.game.applyResult(result);

  this.emit("guessResolved", result);

  this.handlePlayerFinished(playerId);
 }

 // =========================
 // DUEL LOCK
 // =========================
 handlePlayerFinished(playerId) {

  this.finishedPlayers.add(playerId);
  this.locked = true;

  if (this.finishedPlayers.size >= this.game.players.length) {
   this.network?.sendRoundComplete?.();
   this.finishRound("allFinished");
   return;
  }
  this.roundTimer.start(
   10,
   () => this.finishRound("duelTimeout"),
   (t) => this.emit("roundTimerTick", t)
  );
 }

 // =========================
 // MOVE SYSTEM
 // =========================
 registerMove() {
  const ok = this.moves.consume();

  this.emit("movesUpdated", this.moves.getRemaining());

  if (!ok) {
   this.emit("movesLocked");
  }
 }

 // =========================
 // ROUND END
 // =========================
 finishRound(reason) {

  this.timer.clear();
  this.roundTimer.clear();

  this.locked = true;

  this.emit("inputLocked");

  const state = this.game.getState();

  const isLast =
   state.rounds.length >= this.game.config.rules.rounds;

  this.emit("roundResultShown", { state, reason });

  if (isLast) {
   this.game.endGame();
   this.emit("gameEnded", this.game.getState());
  }
 }

 // =========================
 // LEGACY
 // =========================
 lockRoundUI() {
  this.locked = true;
  this.finishedPlayers.clear();

  this.emit("inputLocked");
  this.emit("loadingStarted");
 }
}
