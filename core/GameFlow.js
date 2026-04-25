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

  // =========================
  // STATE FLAGS (SAFE CORE)
  // =========================
  this._started = false;
  this._roundFinishing = false;

  this._timerStarted = false;

  this._currentRound = null;

  // 🔥 HOST SNAPSHOT (SOURCE OF TRUTH)
  this._hostSnapshot = null;

  // 🔥 ROUND GUARDS
  this._roundIndex = null;
  this._startingRound = false;
  this._roundReady = false;
  this._roundLocked = false;

  this._resolveStreetViewReady = null;

  this.bindNetwork();
 }

 // =========================
 // EVENTS
 // =========================
 on(event, cb) {
  if (!this.listeners[event]) this.listeners[event] = [];
  this.listeners[event].push(cb);
 }

 emit(event, data) {
  const cbs = this.listeners[event];
  if (!cbs) return;
  for (let i = 0; i < cbs.length; i++) cbs[i](data);
 }

 // =========================
 // ROUND MODEL
 // =========================
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
 // NETWORK CORE (FIXED)
 // =========================
bindNetwork() {
 if (!this.network) return;

 this.network.onRoom((room) => {
  const game = room.game;
  if (!game) return;

  const rawRound = game.round;
  if (!rawRound) return;

  // =========================
  // GAME START
  // =========================
  if (game.started && !this._started) {
   this._started = true;
   this.game.startGame();
   this.emit("gameStarted", this.game.getState());
  }

  // =========================
  // NORMALIZE
  // =========================
  const current = this.normalizeRound(rawRound);

  const guesses = current.guesses || {};
  const guessKeys = Object.keys(guesses);
  const guessCount = guessKeys.length;

  // =========================
  // 🔥 SEPARATE FLAGS (CRITICAL FIX)
  // =========================

  const roundMetaReady =
    current.index != null;

  const roundViewReady =
    current.actualLocation != null;

  // sync core state
  this.game.syncRoundFromNetwork?.(current);
  this.setCurrentRound(current);

  // =========================
  // HOST LOGIC
  // =========================
  if (this.playerId === "p1") {

   // INITIATOR SET (SAFE)
   if (
    roundMetaReady &&
    guessCount > 0 &&
    !current.initiator
   ) {
    const first = guessKeys[0];

    this.updateRound({
     initiator: first,
     status: "waiting"
    });
   }

   // AUTO FINISH
   if (
    current.status !== "finished" &&
    guessCount >= this.game.players.length
   ) {
    this.updateRound({ status: "finished" });
   }
  }

  // =========================
  // GUEST START (FIXED)
  // =========================
  if (this.playerId !== "p1") {

   // ❗️ IMPORTANT: ONLY actualLocation controls panorama start
   const shouldStart =
    roundViewReady &&
    current.index != null &&
    this._roundIndex !== current.index;

   if (shouldStart && !this._startingRound) {

    this._startingRound = true;
    this._roundIndex = current.index;

    this.startRoundWithLocation(current.actualLocation)
     .finally(() => {
      this._startingRound = false;
     });
   }
  }

  // =========================
  // WAITING (ONLY INITIATOR UI)
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
  // FINISH (SAFE)
  // =========================
  if (
   current.status === "finished" &&
   !this._roundFinishing &&
   roundMetaReady
  ) {
   this._timerStarted = false;
   this.emit("timerStopped");
   this.finishRoundFromState("networkFinish");
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

  this.startRound();
 }

 // =========================
 // ROUND START (HOST ONLY)
 // =========================
 async startRound() {

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

 // =========================
 // CORE ROUND START
 // =========================
 async startRoundWithLocation(location) {

  this._timerStarted = false;
  this._roundLocked = false;

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

  this.emit("roundStarted", this.game.getState());
 }

 // =========================
 // GUESSES (SAFE)
 // =========================
applyGuess(playerId, point) {
 if (this.locked) return;

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

  if (!round.initiator) {
   this.updateRound({
    ...next,
    initiator: playerId,
    status: "waiting"
   });
   return;
  }

  this.updateRound({
   ...next,
   status: "waiting"
  });
 }

 // =========================
 // UPDATE ROUND (HOST ONLY)
 // =========================
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
 // FINISH ROUND
 // =========================
 finishRound(reason) {

  if (this._roundFinishing) return;
  if (!this._roundReady) return;

  this._roundFinishing = true;

  this.timer.clear();
  this.roundTimer.clear();

  this._timerStarted = false;
  this._roundLocked = true;

  this.emit("timerStopped");

  const snap = this._hostSnapshot || this.getCurrentRound();

  this.emit("roundResultShown", {
   state: this.game.getState(),
   round: this.getRoundForUIFromSnapshot?.(snap) || this.getRoundForUI()
  });

  this._roundFinishing = false;
 }

 finishRoundFromState(reason) {
  if (this._roundFinishing) return;
  this.finishRound(reason);
 }

// =========================
 // NEXT ROUND (SAFE)
 // =========================
 async nextRound() {

  if (this._roundFinishing) return;

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

  if (this._roundFinishing) return;

  this._roundFinishing = true;

  this.timer.clear();
  this.roundTimer.clear();

  this.emit("timerStopped");

  this.game.endGame?.();

  this.emit("gameEnded", this.game.getState());

  this._roundFinishing = false;
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

 finishGuess(point) {
  return this.applyGuess(this.playerId, point);
 }

 // =========================
 // UI ADAPTER
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
   index: r.index ?? 0,
   status: r.status ?? "running",
   actualLocation: r.actualLocation ?? null,
   guesses: this.convertGuessesToArray(r.guesses)
  };
 }

 convertGuessesToArray(guessesObj = {}) {
  return Object.entries(guessesObj).map(([playerId, g]) => ({
   playerId,
   lat: g.lat ?? g.guess?.lat,
   lng: g.lng ?? g.guess?.lng,
   score: g.score ?? 0,
   distance: g.distance ?? 0
  }));
 }

 emitUI(event, data) {
  this.emit(event, data);
 }
}
