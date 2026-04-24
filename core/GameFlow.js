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
  this._initiatorId = null;

  this._started = false;
this._currentRoundIndex = null;
this._roundFinishing = false;
  this._finished = false;
  
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
  // ROUND START (guest sync)
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
     () => {}, // ничего не пишем в state
     (t) => this.emit("roundTimerTick", t)
    );

    this.emit("roundTimerStart");
   }
  }

  // =========================
  // AUTO FINISH CONDITION (ВАЖНО)
  // =========================
  const guesses = round.guesses || {};
  const guessCount = Object.keys(guesses).length;

  if (
   round.status !== "finished" &&
   guessCount >= this.game.players.length
  ) {
   this.updateRound({
    status: "finished"
   });
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

 const state = this.game.getState();
 const current = state.currentRound || {};

 const updated = {
  ...current,
  ...patch
 };

 console.log("📡 setRound", updated);

 this.network.setRound(updated);
}
 
handlePlayerFinished(playerId, result) {

 this.emit("inputLocked");

 const state = this.game.getState();
 const current = state.currentRound || {};
 const guesses = current.guesses || {};

 // =========================
 // FIRST GUESS → WAIT STATE
 // =========================
 if (!this._initiatorId) {

  this._initiatorId = playerId;

  this.locked = true;

  this.updateRound({
   status: "waiting",
   initiator: playerId,
   lastGuess: result,
   guesses: {
    ...guesses,
    [playerId]: result
   }
  });

  return;
 }

 // =========================
 // NEXT GUESSES → SYNC ONLY
 // =========================
 this.updateRound({
  guesses: {
   ...guesses,
   [playerId]: result
  }
 });
}

 


finishRound(reason = "manual") {

 if (this._roundFinishing) return;

 this._roundFinishing = true;

 this.timer.clear();
 this.roundTimer.clear();

 this.locked = true;
 this.roundLocked = false;

 this._timerStarted = false;
 this._initiatorId = null;

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

 console.log("🏁 finishRoundFromState", reason);

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
