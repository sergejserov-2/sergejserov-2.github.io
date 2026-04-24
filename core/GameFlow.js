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

  console.log("🧠 [GameFlow] constructor", {
   mode,
   playerId,
   hasNetwork: !!network
  });

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
  // MODE
  // =========================
  this.mode = mode;
  this.network = network;
  this.playerId = playerId;

  // =========================
  // STATE FLAGS
  // =========================
  this.listeners = {};

  this.locked = false;
  this._started = false;
  this._roundFinishing = false;
  this._timerStarted = false;

  // =========================
  // SINGLE SOURCE ROUND
  // =========================
  this._currentRound = null;

  // =========================
  // NETWORK
  // =========================
  this._resolveStreetViewReady = null;

  this.bindNetwork();
 }

 // =========================================================
 // EVENTS
 // =========================================================
 on(event, cb) {
  if (!this.listeners[event]) this.listeners[event] = [];
  this.listeners[event].push(cb);
 }

 emit(event, data) {
  const cbs = this.listeners[event];
  if (!cbs) return;

  for (let i = 0; i < cbs.length; i++) {
   cbs[i](data);
  }
 }

 // =========================================================
 // ROUND STATE (SOURCE OF TRUTH)
 // =========================================================
 getCurrentRound() {
  return this._currentRound;
 }

 setCurrentRound(round) {
  this._currentRound = this.normalizeRound(round);
 }

 normalizeRound(r = {}) {
  return {
   index: r.index ?? 0,
   status: r.status ?? "running",
   actualLocation: r.actualLocation ?? r.location ?? null,
   location: r.location ?? r.actualLocation ?? null,
   initiator: r.initiator ?? null,
   guesses: r.guesses ?? {}
  };
 }

 // =========================================================
 // NETWORK
 // =========================================================
 bindNetwork() {
  if (!this.network) return;

  console.log("🌐 bindNetwork active");

  this.network.onRoom((room) => {

   const game = room.game;
   if (!game) return;

   const round = game.round;
   if (!round) return;

   console.log("📡 [Network Round]", round);

   // =========================
   // GAME START
   // =========================
   if (game.started && !this._started) {
    this._started = true;
    this.game.startGame();
    this.emit("gameStarted", this.game.getState());
   }

   // =========================
   // APPLY NETWORK STATE
   // =========================
   this.setCurrentRound(round);

   const current = this.getCurrentRound();

   // =========================
   // WAITING STATE
   // =========================
   if (current.status === "waiting") {

    const isInitiator = this.playerId === current.initiator;

    if (isInitiator) {
     this.locked = true;
     this.emit("roundWaiting");
    }

    if (!this._timerStarted) {
     this._timerStarted = true;

     this.roundTimer.start(
      10,
      () => {
       if (this.playerId === "p1") {
        this.updateRound({ status: "finished" });
       }
      },
      (t) => this.emit("roundTimerTick", t)
     );

     this.emit("roundTimerStart");
    }
   }

   // =========================
   // AUTO FINISH
   // =========================
   const guessCount = Object.keys(current.guesses).length;

   if (
    this.playerId === "p1" &&
    current.status !== "finished" &&
    guessCount >= this.game.players.length
   ) {
    this.updateRound({ status: "finished" });
   }

                      // =========================
   // FINISH
   // =========================
   if (current.status === "finished" && !this._roundFinishing) {
    this._timerStarted = false;
    this.finishRoundFromState("networkFinish");
   }
  });
 }

 // =========================================================
 // GAME START
 // =========================================================
 startGame() {
  if (this._started) return;

  this._started = true;

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  this.startRound();
 }

 // =========================================================
 // ROUND START
 // =========================================================
 async startRound() {
  this.lockRoundUI();

  const location = await this.generator.generate(this.area);

  const round = this.normalizeRound({
   index: this.game.getState().rounds.length + 1,
   actualLocation: location,
   status: "running",
   guesses: {},
   initiator: null
  });

  this.setCurrentRound(round);

  if (this.mode === "duel" && this.playerId === "p1") {
   this.network.setRound(round);
  }

  this.startRoundWithLocation(location);
 }

 startRoundFromNetwork(round) {
  this.startRoundWithLocation(round.actualLocation || round.location);
 }

 // =========================================================
 // CORE ROUND
 // =========================================================
 async startRoundWithLocation(location) {

  this._timerStarted = false;

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

  this.emit("roundStarted", this.game.getState());
 }

 // =========================================================
 // GUESSES
 // =========================================================
 applyGuess(playerId, point) {
  if (this.locked) return;

  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.emit("guessResolved", result);

  this.handlePlayerFinished(playerId, result);
 }

 handlePlayerFinished(playerId, result) {

  this.emit("inputLocked");

  const round = this.getCurrentRound();

  const guesses = {
   ...round.guesses,
   [playerId]: result
  };

  const next = this.normalizeRound({
   ...round,
   guesses
  });

  this.setCurrentRound(next);

  if (!round.initiator) {
   this.updateRound({
    ...next,
    initiator: playerId,
    status: "waiting"
   });
   return;
  }

  this.updateRound(next);
 }

 updateRound(patch) {
  if (this.playerId !== "p1") return;
  if (!this.network?.setRound) return;

  const next = this.normalizeRound({
   ...this.getCurrentRound(),
   ...patch
  });

  this.setCurrentRound(next);

  this.network.setRound(next);
 }

 // =========================================================
 // FINISH
 // =========================================================
 finishRound(reason = "manual") {

  if (this._roundFinishing) return;

  this._roundFinishing = true;

  this.timer.clear();
  this.roundTimer.clear();

  this.locked = true;

  const round = this.getCurrentRound();
  const state = this.game.getState();

  this.emit("roundResultShown", {
   state,
   round
  });

  this._roundFinishing = false;
 }

 finishRoundFromState(reason) {
  if (this._roundFinishing) return;
  this.finishRound(reason);
 }

 // =========================================================
 // MOVES
 // =========================================================
 registerMove() {
  if (this.locked) return;

  const ok = this.moves.consume();

  this.emit("movesUpdated", this.moves.getRemaining());

  if (!ok) {
   this.locked = true;
   this.emit("movesLocked");
  }
 }// =========================================================
 // STREET VIEW
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
 // UI LOCK
 // =========================================================
 lockRoundUI() {
  this.locked = true;
  this.emit("inputLocked");
  this.emit("loadingStarted");
 }

 finishGuess(point) {
  return this.applyGuess(this.playerId, point);
 }
}
