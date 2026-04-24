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

  console.log("🧠 [GameFlow] constructor", { mode, playerId, hasNetwork: !!network });

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
  // MODE / NETWORK
  // =========================
  this.mode = mode;
  this.network = network;
  this.playerId = playerId;

  // =========================
  // STATE
  // =========================
  this.listeners = {};

  this.locked = false;
  this.roundLocked = false;

  this._started = false;
  this._currentRoundIndex = null;
  this._roundFinishing = false;

  this._resolveStreetViewReady = null;

  // network cache (ONLY mirror, not source of truth)
  this._networkRound = null;

  console.log("🧠 [GameFlow] bindNetwork()");
  this.bindNetwork();
 }

 // =========================================================
 // EVENTS
 // =========================================================
 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  console.log("📡 [GameFlow emit]", event, data);
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================================================
 // SINGLE SOURCE OF TRUTH
 // =========================================================
 getCurrentRound() {
  const state = this.game.getState();
  const local = state?.rounds?.at(-1);

  // network overrides local if exists
  return this._networkRound || local;
 }

 // =========================================================
 // NETWORK SYNC
 // =========================================================
 bindNetwork() {
  if (!this.network) return;

  console.log("🌐 bindNetwork active");

  this.network.onRoom?.((room) => {
   const game = room?.game;
   if (!game) return;

   const round = room.game.round;
   if (!round) return;

   // mirror only
   this.syncRoundFromNetwork(round);

   // GAME START
   if (game.started && !this._started) {
    this._started = true;
    this.game.startGame();
    this.emit("gameStarted", this.game.getState());
   }

   // ROUND START (guest)
   if (
    this.playerId !== "p1" &&
    round.location &&
    round.status === "running" &&
    this._currentRoundIndex !== round.index
   ) {
    this._currentRoundIndex = round.index;
    this.startRoundFromNetwork(round);
   }

   // TIMER (host-controlled)
   if (round.status === "waiting") {
    if (this.playerId === round.initiator) {
     this.locked = true;
     this.emit("roundWaiting");
    }
   }

   // AUTO FINISH
   const guesses = round.guesses || {};
   if (
    this.playerId === "p1" &&
    round.status !== "finished" &&
    Object.keys(guesses).length >= this.game.players.length
   ) {
    this.updateRound({ status: "finished" });
   }

   // FINISH
   if (round.status === "finished" && !this._roundFinishing) {
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

  if (this.mode === "solo") {
   const location = await this.generator.generate(this.area);
   return this.startRoundWithLocation(location);
  }

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
 }

 startRoundFromNetwork(round) {
  if (this.playerId === "p1") return;
  if (!round?.location) return;

  this.startRoundWithLocation(round.location);
 }

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
 // GUEST MOVES
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
 // GUESSES
 // =========================================================
 applyGuess(playerId, point) {
  if (this.roundLocked) return;

  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.emit("guessResolved", result);

  this.handlePlayerFinished(playerId, result);
 }

 handlePlayerFinished(playerId, result) {
  this.emit("inputLocked");

  const round = this.getCurrentRound();
  const guesses = round?.guesses || {};

  const nextGuesses = {
   ...guesses,
   [playerId]: result
  };

  if (!round.initiator) {
   this.network?.setRound({
    ...round,
    status: "waiting",
    initiator: playerId,
    guesses: nextGuesses
   });
   return;
  }

  this.network?.setRound({
   ...round,
   guesses: nextGuesses,
   status: round.status
  });
 }

 // =========================================================
 // ROUND FINISH
 // =========================================================
 finishRound(reason = "manual") {
  if (this._roundFinishing) return;

  this._roundFinishing = true;

  this.timer.clear();
  this.roundTimer.clear();

  this.locked = true;

  const state = this.game.getState();
  const round = this.getCurrentRound();

  console.log("📊 FINAL ROUND DATA", round);

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

 finishRoundFromState(reason = "networkFinish") {
  if (this._roundFinishing) return;

  this.finishRound(reason);
 }

 // =========================================================
 // NETWORK SYNC (SAFE MIRROR ONLY)
 // =========================================================
 syncRoundFromNetwork(round) {
  this._networkRound = {
   ...(this._networkRound || {}),
   ...round,
   guesses: round.guesses || {}
  };
 }

 // =========================================================
 // UPDATE HOST ROUND
 // =========================================================
 updateRound(patch) {
  if (!this.network?.setRound) return;
  if (this.playerId !== "p1") return;

  const base = this.getCurrentRound() || {};

  this.network.setRound({
   ...base,
   ...patch
  });
 }

 // =========================================================
 // STREET VIEW SYNC
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
