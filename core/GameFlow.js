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
  // SINGLE SOURCE OF ROUND
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
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================================================
 // SINGLE SOURCE OF TRUTH
 // =========================================================
 getCurrentRound() {
  return this._currentRound;
 }

 setCurrentRound(round) {
  this._currentRound = {
   index: round?.index ?? 0,
   location: round?.location ?? null,
   actualLocation: round?.location ?? round?.actualLocation ?? null,
   initiator: round?.initiator ?? null,
   status: round?.status ?? "running",
   guesses: round?.guesses ?? {}
  };
 }

 // =========================================================
 // NETWORK BIND
 // =========================================================
 bindNetwork() {
 if (!this.network) return;

 console.log("🌐 bindNetwork active");

 this.network.onRoom?.((room) => {
  const game = room?.game;
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
  // ROUND START (GUEST)
  // =========================
  if (
   this.playerId !== "p1" &&
   round.location &&
   round.status === "running" &&
   this._currentRoundIndex !== round.index
  ) {
   console.log("📡 START ROUND FROM NETWORK (GUEST)");

   this._currentRoundIndex = round.index;
   this.startRoundFromNetwork(round);
  }

  // =========================
  // WAITING STATE
  // =========================
  if (round.status === "waiting") {
   const isInitiator = this.playerId === round.initiator;

   if (isInitiator) {
    this.locked = true;
    this.emit("roundWaiting");
   }

   if (!this._timerStarted) {
    this._timerStarted = true;

    console.log("⏱️ START TIMER FROM NETWORK STATE");

    this.roundTimer.start(
     10,
     () => {
      console.log("⏱️ TIMER DONE → FINISH");

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
  // AUTO FINISH (ALL GUESSES)
  // =========================
  const guesses = round.guesses || {};
  const guessCount = Object.keys(guesses).length;

  if (
   this.playerId === "p1" &&
   round.status !== "finished" &&
   guessCount >= this.game.players.length
  ) {
   console.log("🏁 ALL GUESSES → FINISH");

   this.updateRound({ status: "finished" });
  }

  // =========================
  // FINISH STATE
  // =========================
  if (round.status === "finished" && !this._roundFinishing) {
   console.log("🏁 FINISH FROM NETWORK");

   this._timerStarted = false;

   this.finishRoundFromState("networkFinish");
  }
 });
}

 // =========================================================
 // START GAME
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

 this.setCurrentRound({
   index: (this.game.getState().rounds.length || 0) + 1,
   location,
   actualLocation: location,
   status: "running",
   guesses: {}
  });

  if (this.mode === "duel" && this.playerId === "p1") {
   await this.network?.setRound(this.getCurrentRound());
  }

  this.startRoundWithLocation(location);
 }

 startRoundFromNetwork(round) {
  if (!round?.location) return;

  this.startRoundWithLocation(round.location);
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
   ...(round.guesses || {}),
   [playerId]: result
  };

  this.setCurrentRound({ ...round, guesses });

  if (!round.initiator) {
   this.updateRound({
    ...round,
    initiator: playerId,
    status: "waiting",
    guesses
   });
   return;
  }

  this.updateRound({
   ...round,
   guesses
  });
 }

 updateRound(patch) {
  if (this.playerId !== "p1") return;
  if (!this.network?.setRound) return;

  this.network.setRound({
   ...this.getCurrentRound(),
   ...patch
  });
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

  if (state.rounds.length >= this.game.config.rules.rounds) {
   this.game.endGame();
   this.emit("gameEnded", state);
  }

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
 }

 // =========================================================
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
 // LEGACY
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
