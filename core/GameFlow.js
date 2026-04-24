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

  this.finishedPlayers = new Set();

  this._started = false;
  this._roundFinishing = false;

  this._resolveRoundStart = null;
  this._pendingRoundLocation = null;

  this._resolveStreetViewReady = null;

  console.log("🧠 [GameFlow] bindNetwork()");
  this.bindNetwork();
 }

 // =========================================================
 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  console.log("📡 [GameFlow emit]", event, data);
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================================================
bindNetwork() {
 if (!this.network) return;

 console.log("🌐 [GameFlow] bindNetwork active");

 // =========================
 // HOST → GUEST ROUND SYNC (FIX)
 // =========================
 this.network.onRoom?.((room) => {
  const round = room?.game?.round;

  if (!round?.location) return;

  console.log("🌍 [GameFlow] ROOM ROUND UPDATE", round);

  // ❗ важно: только guest реагирует
  if (this.playerId !== "p1") {
   this.startRoundFromNetwork(round);
  }
 });

 // =========================
 // ROUND START SIGNAL (legacy / optional)
 // =========================
 this.network.onRoundStarted?.((data) => {
  console.log("🌐 [GameFlow] onRoundStarted", data);

  this.startRoundFromNetwork(data);
 });

 // =========================
 // GUESSES
 // =========================
 this.network.onGuess?.((data) => {
  this.applyExternalGuess(data);
 });
 
 // =========================
 // ROUND COMPLETE
 // =========================
 this.network.onRoundComplete?.(() => {
  this.syncRoundComplete();
 });

 // =========================
 // GAME START
 // =========================
 this.network.onStart?.(() => {
  this.startGameFromNetwork();
 });
}

 // =========================================================
 // GAME START
 // =========================================================
 startGame() {
  console.log("🚀 [GameFlow] startGame ENTER", {
   mode: this.mode,
   playerId: this.playerId,
   started: this._started
  });

  if (this._started) {
   console.log("🚀 [GameFlow] startGame EXIT (already started)");
   return;
  }

  this._started = true;

  console.log("🚀 [GameFlow] game.startGame()");
  this.game.startGame();

  console.log("🚀 [GameFlow] emit gameStarted");
  this.emit("gameStarted", this.game.getState());

  console.log("🚀 [GameFlow] startRound CALL");
  this.startRound();
 }

 startGameFromNetwork() {
  console.log("🌐 [GameFlow] startGameFromNetwork ENTER", {
   playerId: this.playerId
  });

  if (this._started) {
   console.log("🌐 [GameFlow] already started EXIT");
   return;
  }

  this._started = true;

  console.log("🌐 [GameFlow] game.startGame()");
  this.game.startGame();

  console.log("🌐 [GameFlow] emit gameStarted");
  this.emit("gameStarted", this.game.getState());
 }

 // =========================================================
 // ROUND START
 // =========================================================
 async startRound() {
  console.log("🎯 [GameFlow] startRound ENTER", {
   mode: this.mode,
   playerId: this.playerId
  });

  this.lockRoundUI();

  console.log("🔒 [GameFlow] lockRoundUI DONE");

  // SOLO
  if (this.mode === "solo") {
   console.log("🎯 [GameFlow] SOLO generate");

   const location = await this.generator.generate(this.area);

   console.log("🎯 [GameFlow] SOLO location", location);

   return this.startRoundWithLocation(location);
  }

  // HOST
  if (this.playerId === "p1") {
   console.log("🎯 [GameFlow] HOST generate");

   const location = await this.generator.generate(this.area);

   console.log("🎯 [GameFlow] HOST location", location);

  const roundIndex =
    (this.game.getState().rounds?.length || 0) + 1;

   console.log("🎯 [GameFlow] send round to network", roundIndex);

   await this.network?.setRound({
    index: roundIndex,
    location,
    status: "running"
   });

   return this.startRoundWithLocation(location);
  }

  // GUEST
  console.log("🎯 [GameFlow] GUEST waiting for round");

  const location = await this.waitForRoundFromNetwork();

  console.log("🎯 [GameFlow] GUEST got location", location);

  return this.startRoundWithLocation(location);
 }

 // =========================================================
 // NETWORK ROUND
 // =========================================================
 startRoundFromNetwork(round) {
  console.log("🌍 [GameFlow] startRoundFromNetwork", round);

  if (this.playerId === "p1") return;

  if (!round?.location) {
   console.warn("⚠️ [GameFlow] empty round");
   return;
  }

  this.startRoundWithLocation(round.location);
 }

 // =========================================================
 // CORE ROUND
 // =========================================================
 async startRoundWithLocation(location) {
  console.log("📍 [GameFlow] startRoundWithLocation ENTER", location);

  if (!location) {
   console.error("❌ [GameFlow] location is undefined");
  }

  this.game.startRound(location);

  console.log("📍 [GameFlow] emit streetViewSetLocation");

  this.emit("streetViewSetLocation", location);

  console.log("📍 [GameFlow] waitForStreetViewReady...");
  await this.waitForStreetViewReady();

  console.log("📍 [GameFlow] streetView READY");

  this.emit("loadingFinished");

  console.log("📍 [GameFlow] starting timer");

  this.timer.start(
   this.game.config.rules.time,
   () => this.finishRound("timeout"),
   (t) => this.emit("timerTick", t)
  );

  this.moves.reset(this.game.config.rules.moves);

  this.locked = false;

  console.log("📍 [GameFlow] ROUND STARTED OK");

  this.emit("roundStarted", this.game.getState());
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








applyGuess(playerId, point) {
 if (this.roundLocked) return;

 const result = this.game.setGuess(playerId, point);
 if (!result) return;

 this.game.applyResult(result);

 this.emit("guessResolved", result);

 this.handlePlayerFinished(playerId);
}

handlePlayerFinished(playerId) {

 this.finishedPlayers.add(playerId);

 this.emit("inputLocked");

 // =========================
 // CASE 1: ALL PLAYERS FINISHED
 // =========================
 if (this.finishedPlayers.size >= this.game.players.length) {

  if (this.mode === "duel") {
   this.network?.sendRoundComplete?.();
  }

  this.finishRound("allFinished");
  return;
 }

 // =========================
 // CASE 2: FIRST PLAYER → WAITING STATE
 // =========================
 this.locked = true;

 this.emit("roundWaiting");

 // =========================
 // START DUEL TIMER IF NOT RUNNING
 // =========================
 if (!this.roundLocked && this.mode === "duel") {

  this.roundLocked = true;

  this.roundTimer.start(
   10,
   () => this.finishRound("duelTimeout"),
   (t) => this.emit("roundTimerTick", t)
  );

  this.emit("roundTimerStart");
 }
}

 finishRound(reason = "manual") {

 if (this._roundFinishing) return;
 this._roundFinishing = true;

 this.timer.clear();
 this.roundTimer.clear();

 this.locked = true;
 this.roundLocked = false;
 this.finishedPlayers.clear();

 const state = this.game.getState();

 const isLast =
  state.rounds.length >= this.game.config.rules.rounds;

 this.emit("roundResultShown", { state, reason });

 if (isLast) {
  this.game.endGame();
  this.emit("gameEnded", state);
 }

 this._roundFinishing = false;
}












 
 // =========================================================
 // STREET VIEW SYNC
 // =========================================================
 waitForStreetViewReady() {
  console.log("⏳ [GameFlow] waitForStreetViewReady ENTER");

  return new Promise(res => {
   this._resolveStreetViewReady = res;
  });
 }

 streetViewReady() {
  console.log("📡 [GameFlow] streetViewReady CALLED");

  this._resolveStreetViewReady?.();

  this._resolveStreetViewReady = null;
 }

 // =========================================================
 // LEGACY
 // =========================================================
 lockRoundUI() {
  console.log("🔒 [GameFlow] lockRoundUI");

  this.locked = true;
  this.finishedPlayers.clear();

  this.emit("inputLocked");
  this.emit("loadingStarted");
 }
}
