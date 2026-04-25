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

  this._started = false;
  this._roundFinishing = false;
  this._roundTransitioning = false;

  this._timerStarted = false;

  this._currentRound = null;

  this._roundIndex = null;
  this._lastFinishedRoundIndex = null;

  this._resultEmittedForRound = null;

  this._resolveStreetViewReady = null;

  this.bindNetwork();
 }

 on(event, cb) {
  if (!this.listeners[event]) this.listeners[event] = [];
  this.listeners[event].push(cb);
 }

 emit(event, data) {
  const cbs = this.listeners[event];
  if (!cbs) return;
  for (let i = 0; i < cbs.length; i++) cbs[i](data);
 }

 getCurrentRound() {
  return this._currentRound;
 }

 setCurrentRound(round) {
  this._currentRound = this.normalizeRound(round);
 }

 normalizeRound(r) {
  if (!r) {
   return {
    index: 0,
    status: "running",
    actualLocation: null,
    initiator: null,
    guesses: {}
   };
  }

  return {
   index: r.index ?? 0,
   status: r.status ?? "running",
   actualLocation: r.actualLocation ?? null,
   initiator: r.initiator ?? null,
   guesses: r.guesses ?? {}
  };
 }

 // =========================
 // NETWORK CORE (FIXED RESULT FLOW)
 // =========================
 bindNetwork() {
  if (!this.network) return;

  this.network.onRoom((room) => {

   const game = room.game;
   if (!game) return;

   const rawRound = game.round;
   if (!rawRound) return;

   // GAME START
   if (game.started && !this._started) {
    this._started = true;
    this.game.startGame();
    this.emit("gameStarted", this.game.getState());
   }

   const current = this.normalizeRound(rawRound);

   this.game.syncRoundFromNetwork?.(current);
   this.setCurrentRound(current);

   const guesses = current.guesses || {};
   const guessKeys = Object.keys(guesses);
   const guessCount = guessKeys.length;

   const hasIndex = current.index != null;
   const hasLocation = current.actualLocation != null;

   // =========================
   // HOST LOGIC (ONLY WRITES)
   // =========================
   if (this.playerId === "p1") {

    if (
     hasIndex &&
     hasLocation &&
     guessCount > 0 &&
     !current.initiator
    ) {
     this.updateRound({
      initiator: guessKeys[0],
      status: "waiting"
     });
    }

    if (
     current.status !== "finished" &&
     guessCount >= this.game.players.length
    ) {
     this.updateRound({ status: "finished" });
    }
   }

   // =========================
   // ROUND START (ALL PLAYERS)
   // =========================
   if (
    hasIndex &&
    hasLocation &&
    this._roundIndex !== current.index
   ) {
    this._roundIndex = current.index;

    this.startRoundWithLocation(current.actualLocation);
   }

   // =========================
   // WAITING (UNCHANGED)
   // =========================
   if (current.status === "waiting") {

    if (current.initiator === this.playerId) {
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
      (t) => this.emit("timerTick", t)
     );

     this.emit("timerStarted");
    }
   }

   // =========================
   // 💥 ONLY TRUE RESULT SCREEN TRIGGER
   // =========================
   if (
    current.status === "finished" &&
    hasIndex &&
    this._lastFinishedRoundIndex !== current.index
   ) {

    this._lastFinishedRoundIndex = current.index;

    this._timerStarted = false;
    this.emit("timerStopped");

   // ❗ NO LOCAL finishRound LOGIC ANYMORE HERE
    // ❗ PURE NETWORK → UI EVENT
    this.emit("roundResultShown", {
     state: this.game.getState(),
     round: this.getRoundForUI(),
     reason: "network"
    });
   }
  });
 }

 // =========================
 // START GAME
 // =========================
 startGame() {
  if (this._started) return;

  this._started = true;
  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  if (this.playerId === "p1") {
   this.startRound();
  }
 }

 // =========================
 // HOST ROUND CREATION
 // =========================
 async startRound() {
  if (this.playerId !== "p1") return;

  const location = await this.generator.generate(this.area);

  const round = this.normalizeRound({
   index: this.game.getState().rounds.length + 1,
   actualLocation: location,
   status: "running",
   guesses: {},
   initiator: null
  });

  this.network.setRound(round);
 }

 // =========================
 // CORE START
 // =========================
 async startRoundWithLocation(location) {

  this._timerStarted = false;

  this.game.startRound(location);

  this.emit("streetViewSetLocation", location);

  await this.waitForStreetViewReady();

  this.emit("loadingFinished");

  this.timer.start(
   this.game.config.rules.time,
   () => {},
   (t) => this.emit("timerTick", t)
  );

  this.moves.reset(this.game.config.rules.moves);

  this.emit("roundStarted", this.game.getState());
 }

 // =========================
 // GUESSES (UNCHANGED LOGIC)
 // =========================
 applyGuess(playerId, point) {
  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.emit("guessResolved", result);
  this.network?.updateGuess?.(playerId, result);

  this.handlePlayerFinished(playerId, result);
 }

 handlePlayerFinished(playerId, result) {
  const round = this.getCurrentRound();
  if (!round) return;

  const guesses = {
   ...round.guesses,
   [playerId]: result
  };

  const next = this.normalizeRound({
   ...round,
   guesses
  });

  this.setCurrentRound(next);

  if (this.playerId !== "p1") return;

  this.updateRound(next);
 }

 updateRound(patch) {
  if (this.playerId !== "p1") return;
  if (!this.network?.setRound) return;

  const base = this.getCurrentRound() || {};

  const next = this.normalizeRound({
   ...base,
   ...patch
  });

  this.setCurrentRound(next);
  this.network.setRound(next);
 }

 // =========================
 // RESULT LOGIC (NOW PURELY NETWORK DRIVEN)
 // =========================
 finishRound(reason) {
  this.timer.clear();
  this.roundTimer.clear();
  this._timerStarted = false;
 }

 // =========================
 // NEXT ROUND (HOST ONLY)
 // =========================
 async nextRound() {
  if (this.playerId !== "p1") return;

  this.timer.clear();
  this.roundTimer.clear();

  this._timerStarted = false;

  this.game.commitRound?.();

  if (this.game.isGameEnded()) {
   this.endGame();
   return;
  }

  await this.startRound();
 }

 // =========================
 // END GAME
 // =========================
 endGame() {
  this.timer.clear();
  this.roundTimer.clear();

  this.emit("timerStopped");

  this.game.endGame?.();

  this.emit("gameEnded", this.game.getState());
 }

 // =========================
 // MOVES
 // =========================
 registerMove() {
  const ok = this.moves.consume();

  this.emit("movesUpdated", this.moves.getRemaining());

  if (!ok) {
   this.emit("movesLocked", this.moves.IsLocked());
  }
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

 finishGuess(point) {
  return this.applyGuess(this.playerId, point);
 }

 // =========================
 // UI
 // =========================
 getRoundForUI() {
  const r = this.getCurrentRound();

  if (!r) {
   return {
    index: 0,
    status: "running",
    actualLocation: null,
    guesses: []
   };
  }

 return {
   index: r.index,
   status: r.status,
   actualLocation: r.actualLocation,
   guesses: Object.entries(r.guesses).map(([playerId, g]) => ({
    playerId,
    lat: g.lat ?? g.guess?.lat,
    lng: g.lng ?? g.guess?.lng,
    score: g.score ?? 0,
    distance: g.distance ?? 0
   }))
  };
 }
}
