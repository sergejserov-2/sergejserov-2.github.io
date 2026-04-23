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

  this.listeners = {};

  // =========================
  // MODE
  // =========================
  this.mode = mode;
  this.network = network;

  // =========================
  // FSM (NEW CORE)
  // =========================
  this.roundState = "IDLE";
  // IDLE → LOADING → ACTIVE → WAITING → RESOLVING → ENDED

  // =========================
  // DUEL STATE
  // =========================
  this.finishedPlayers = new Set();
  this._resolveStreetViewReady = null;

  this.roundTimer = services.timer;

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
 // GAME START
 // =========================
 async startGame() {
  this.roundState = "IDLE";

  this.finishedPlayers.clear();

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  await this.startRound();
 }

 // =========================
 // ROUND START
 // =========================
 async startRound() {
  this.setState("LOADING");

  this.finishedPlayers.clear();

  this.emit("inputLocked");
  this.emit("loadingStarted");

  const location = await this.generator.generate(this.area);

  this.game.startRound(location);

  this.emit("streetViewSetLocation", location);

  await this.waitForStreetViewReady();

  this.emit("loadingFinished");

  // =========================
  // TIMER (SOLO + DUEL BASE)
  // =========================
  this.timer.start(
   this.game.config.rules.time,
   () => this.finishRound("timeout"),
   (t) => this.emit("timerTick", t)
  );

  // =========================
  // MOVES RESET
  // =========================
  this.moves.reset(this.game.config.rules.moves);
  this.emit("movesUpdated", this.moves.getRemaining());

  this.setState("ACTIVE");

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
  if (this.roundState !== "ACTIVE") return;

  // DUEL → sync first
  if (this.mode === "duel") {
   this.network?.sendGuess({
    playerId,
    guess: point
   });
  }

  this.applyGuess(playerId, point);
 }

 // =========================
 // CORE APPLY
 // =========================
 applyGuess(playerId, point) {
  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.game.applyResult(result);

  this.emit("guessResolved", result);

  if (this.mode === "solo") {
   this.finishRound("guess");
   return;
  }

  this.handleDuelPlayerFinished(playerId);
 }

 // =========================
 // NETWORK IN
 // =========================
 applyExternalGuess({ playerId, guess }) {
  this.applyGuess(playerId, guess);
 }

 // =========================
 // DUEL LOGIC (FSM CONTROLLED)
 // =========================
 handleDuelPlayerFinished(playerId) {
  if (this.roundState !== "ACTIVE") return;

  this.finishedPlayers.add(playerId);

  this.emit("playerFinished", {
   playerId,
   state: this.game.getState()
  });

  this.setState("WAITING");
  this.emit("inputLocked");
  this.emit("roundWaiting");

 // =========================
  // ALL PLAYERS DONE
  // =========================
  if (this.finishedPlayers.size >= this.game.players.length) {
   this.network?.sendRoundComplete?.();
   this.finishRound("allPlayersFinished");
   return;
  }

  // =========================
  // FIRST FINISH → TIMER WINDOW
  // =========================
  if (this.roundState !== "RESOLVING") {
   this.setState("RESOLVING");

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
  if (this.roundState !== "ACTIVE") return;

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
  this.timer.clear();
  this.roundTimer.clear();

  this.setState("RESOLVING");

  this.emit("inputLocked");

  const state = this.game.getState();

  const isLast =
   state.rounds.length >= this.game.config.rules.rounds;

  this.emit("roundResultShown", { state, reason });

  if (isLast) {
   this.game.endGame();
   this.setState("ENDED");
   this.emit("gameEnded", this.game.getState());
   return;
  }

  this.setState("IDLE");
 }

 // =========================
 // ROUND SYNC
 // =========================
 syncRoundComplete() {
  if (this.roundState !== "RESOLVING") return;

  this.finishedPlayers.clear();
  this.setState("IDLE");

  this.emit("roundSyncComplete");
 }

 async nextRound() {
  if (this.roundState === "ENDED") return;
  await this.startRound();
 }

 // =========================
 // FSM HELPER
 // =========================
 setState(state) {
  this.roundState = state;
  this.emit("stateChanged", state);
 }
}
