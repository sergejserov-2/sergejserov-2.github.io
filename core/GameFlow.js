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
this._currentRoundIndex = null;
this._roundFinishing = false;
  this._finished = false;
  
  this._resolveRoundStart = null;
  this._pendingRoundLocation = null;
  this._initiatorId = null;
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

 console.log("🌐 bindNetwork active");

 this.network.onRoom?.((room) => {

  const game = room?.game;
  if (!game) return;

  const round = game.round;
  if (!round) return;

  // =========================
  // GAME START
  // =========================
  if (game.started && !this._started) {
   this._started = true;

   this.game.startGame();
   this.emit("gameStarted", this.game.getState());
  }

  // =========================
  // ROUND START (GUEST ONLY)
  // =========================
  if (
   this.playerId !== "p1" &&
   round.location &&
   round.status === "running" &&
   this._currentRoundIndex !== round.index
  ) {
   this._currentRoundIndex = round.index;

   this.startRoundFromNetwork(round);
  }

  // =========================
  // WAIT STATE → START TIMER UI (NO STATE CHANGE)
  // =========================
if (round.status === "waiting") {

 const isInitiator = this.playerId === round.initiator;

 if (isInitiator) {
  // только он видит waiting screen
  this.emit("roundWaiting");
  this.locked = true;
 }

 // остальные НЕ видят waiting
 // но запускают таймер
 if (!this._timerStarted) {
  this._timerStarted = true;

  this.roundTimer.start(
   10,
   () => {
    this.updateRound({ status: "finished" });
   },
   (t) => this.emit("roundTimerTick", t)
  );

  this.emit("roundTimerStart");
 }
}

  // =========================
  // FINISHED STATE
  // =========================
if (round.status === "finished" && !this._roundFinishing) {

 console.log("🏁 FINISHED");

 this._timerStarted = false;

 this.finishRoundFromState("networkFinish");
}
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
 }

 // =========================================================
 // NETWORK ROUND
 // =========================================================
startRoundFromNetwork(round) {
 if (this.playerId === "p1") return;

 if (!round?.location) return;

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

 this.handlePlayerFinished(playerId, result);
}

updateRound(patch) {
 if (!this.network?.setRound) return;

 const current = this.game.getState().currentRound;

 const updated = {
  ...current,
  ...patch
 };

 console.log("📡 setRound", updated);

 this.network.setRound(updated);
}

 
handlePlayerFinished(playerId, result) {

 this.finishedPlayers.add(playerId);
 this.emit("inputLocked");

 // =========================
 // FIRST GUESS → ONLY INITIATOR SETS WAITING
 // =========================
 if (this.finishedPlayers.size === 1) {

  console.log("➡️ FIRST GUESS");

  this._initiatorId = playerId;

  this.locked = true;

  // 🔥 Firebase state
  this.updateRound({
   status: "waiting",
   lastGuess: result,
   initiator: playerId
  });

  return;
 }

 // =========================
 // ALL PLAYERS → FINISHED
 // =========================
 if (this.finishedPlayers.size >= this.game.players.length) {

  console.log("➡️ FINISHED");

  this.updateRound({
   status: "finished"
  });

  return;
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
 this._timerStarted = false;

 const state = this.game.getState();

 this.emit("roundResultShown", { state, reason });

 if (state.rounds.length >= this.game.config.rules.rounds) {
  this.game.endGame();
  this.emit("gameEnded", state);
 }

 this._currentRoundIndex = null;
 this._roundFinishing = false;
}



finishRoundFromState(reason = "networkFinish") {
 if (this._roundFinishing) return;

 console.log("🏁 [GameFlow] finishRoundFromState", reason);

 this.finishRound(reason);
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
 finishGuess(point) {
 return this.applyGuess(this.playerId, point);
}
 
}
