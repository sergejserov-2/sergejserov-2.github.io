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
  this.network = network; // теперь = roomController
  this.playerId = playerId;

  this.listeners = {};

  this.locked = false;
  this.roundLocked = false;

  this.finishedPlayers = new Set();

  this._resolveStreetViewReady = null;

  this._started = false;
  this._lastRoundIndex = -1;

  this._gameStartedHandled = false;

  this.bindState();
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
 // STATE BINDING (CORE)
 // =========================
 bindState() {
  if (!this.network) return;

  this.network.onRoom((room) => {
   if (!room) return;

   const game = room.game;

   // =========================
   // GAME START
   // =========================
   if (game?.started && !this._gameStartedHandled) {
    this._gameStartedHandled = true;

    console.log("🔥 GAME START (STATE)");

    this.game.startGame();
    this.emit("gameStarted", this.game.getState());
   }

   // =========================
   // ROUND START
   // =========================
   const round = game?.round;

   if (!round) return;

   if (round.index === this._lastRoundIndex) return;

   this._lastRoundIndex = round.index;

   console.log("🌍 ROUND STATE RECEIVED", round);

   this.startRoundWithLocation(round.location);
  });
 }

 // =========================
 // ENTRY POINT
 // =========================
 start({ role }) {
  if (this._started) return;

  this._started = true;

  console.log("🚀 GAMEFLOW START", {
   role,
   mode: this.mode
  });

  // SOLO
  if (this.mode === "solo") {
   this.game.startGame();
   this.emit("gameStarted", this.game.getState());

   this.startNextRoundSolo();
   return;
  }

  // DUEL → только host инициирует
  if (role === "host") {
   this.network.startGame?.(this.game.config);
   this.startNextRound();
  }
 }

 // =========================
 // ROUND CONTROL (HOST ONLY)
 // =========================
 async startNextRound() {
  const location = await this.generator.generate(this.area);

  const round = {
   index: this._lastRoundIndex + 1,
   location
  };

  console.log("📡 PUSH ROUND", round);

  this.network.setRound(round);
 }

 async startNextRoundSolo() {
  const location = await this.generator.generate(this.area);
  this.startRoundWithLocation({ location, index: 0 });
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

 async startRoundWithLocation(round) {
  const location = round.location;

  this.lockRoundUI();

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
 // MOVES (НЕ ПОТЕРЯЛИ)
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
 // GUESS (НЕ ПОТЕРЯЛИ)
 // =========================
 finishGuess(point) {
  if (this.locked || this.roundLocked) return;

  const result = this.game.setGuess(this.playerId, point);
  if (!result) return;

  this.game.applyResult(result);

  this.emit("guessResolved", result);

  this.handleFinish();
 }

 handleFinish() {
  this.locked = true;

  this.emit("inputLocked");
  this.emit("roundWaiting");
 }

 // =========================
 // ROUND END
 // =========================
 finishRound(reason = "manual") {
  this.timer.clear();
  this.roundTimer.clear();

  this.locked = true;

  const state = this.game.getState();

  const isLast =
   state.rounds.length >= this.game.config.rules.rounds;

  this.emit("roundResultShown", {
   state,
   reason
  });

  if (isLast) {
   this.game.endGame();
   this.emit("gameEnded", this.game.getState());
  }
 }
}
