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
 on(event, cb) {
  if (!this.listeners[event]) {
   this.listeners[event] = [];
  }
  this.listeners[event].push(cb);
 }

 emit(event, data) {
  this.listeners[event].forEach(cb => cb(data));
 }

 // =========================================================
 getCurrentRound() {
  return this._currentRound;
 }

 setCurrentRound(round) {
  this._currentRound = {
   index: round.index,
   location: round.location,
   actualLocation: round.actualLocation,
   initiator: round.initiator,
   status: round.status,
   guesses: round.guesses
  };
 }

 // =========================================================
 bindNetwork() {
  if (!this.network) return;

  console.log("🌐 bindNetwork active");

  this.network.onRoom((room) => {

   const game = room.game;
   const round = game.round;

   if (!game) return;
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
   const guesses = round.guesses;
   const guessCount = Object.keys(guesses).length;

   if (
    this.playerId === "p1" &&
    round.status !== "finished" &&
    guessCount >= this.game.players.length
   ) {
    this.updateRound({ status: "finished" });
   }

   // =========================
   // FINISH STATE
   // =========================
   if (round.status === "finished" && !this._roundFinishing) {
    this._timerStarted = false;
    this.finishRoundFromState("networkFinish");
   }
  });
 }

 // =========================================================
 startGame() {
  if (this._started) return;

  this._started = true;

  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  this.startRound();
 }

 // =========================================================
 async startRound() {
  this.lockRoundUI();

  const location = await this.generator.generate(this.area);

 this.setCurrentRound({
   index: this.game.getState().rounds.length + 1,
   location: location,
   actualLocation: location,
   status: "running",
   guesses: {}
  });

  if (this.mode === "duel" && this.playerId === "p1") {
   this.network.setRound(this.getCurrentRound());
  }

  this.startRoundWithLocation(location);
 }

 startRoundFromNetwork(round) {
  this.startRoundWithLocation(round.location);
 }

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

  const guesses = round.guesses;
  guesses[playerId] = result;

  this.setCurrentRound({
   index: round.index,
   location: round.location,
   actualLocation: round.actualLocation,
   initiator: round.initiator,
   status: round.status,
   guesses: guesses
  });

  if (!round.initiator) {

   this.updateRound({
    index: round.index,
    location: round.location,
    actualLocation: round.actualLocation,
    initiator: playerId,
    status: "waiting",
    guesses: guesses
   });

   return;
  }

  this.updateRound({
   index: round.index,
   location: round.location,
   actualLocation: round.actualLocation,
   initiator: round.initiator,
   status: round.status,
   guesses: guesses
  });
 }

 updateRound(patch) {
  if (this.playerId !== "p1") return;
  if (!this.network.setRound) return;

  this.network.setRound({
   ...this.getCurrentRound(),
   ...patch
  });
 }

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
 waitForStreetViewReady() {
  return new Promise(res => {
   this._resolveStreetViewReady = res;
  });
 }

 streetViewReady() {
  this._resolveStreetViewReady();
  this._resolveStreetViewReady = null;
 }

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
