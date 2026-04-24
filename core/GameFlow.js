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

  // CORE
  this.game = game;
  this.generator = generator;
  this.area = area;

  // SERVICES
  this.timer = services.timer;
  this.roundTimer = services.timer;
  this.moves = services.moves;

  // MODE
  this.mode = mode;
  this.network = network;
  this.playerId = playerId;

  // STATE
  this.listeners = {};

  this.locked = false;
  this.roundLocked = false;

  this._started = false;
  this._currentRound = null;   // ⭐ ЕДИНСТВЕННЫЙ источник
  this._roundFinishing = false;

  this._resolveStreetViewReady = null;

  console.log("🧠 [GameFlow] bindNetwork()");
  this.bindNetwork();
 }

 // =========================================================
 // API
 // =========================================================
 getCurrentRound() {
  return this._currentRound;
 }

 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  console.log("📡 [GameFlow emit]", event, data);
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================================================
 // NETWORK
 // =========================================================
 bindNetwork() {
  if (!this.network) return;

  console.log("🌐 bindNetwork active");

  this.network.onRoom?.((room) => {

   const game = room?.game;
   const round = game?.round;
   if (!game || !round) return;

   // ⭐ SINGLE SOURCE UPDATE
   this._currentRound = round;

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
    this._currentRound?.index !== round.index
   ) {
    this.startRoundFromNetwork(round);
   }

   // TIMER
   if (round.status === "waiting") {
    this.handleWaiting(round);
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
    this.finishRoundFromState();
   }
  });
 }

 // =========================================================
 handleWaiting(round) {
  if (this.playerId === round.initiator) {
   this.locked = true;
   this.emit("roundWaiting");
  }

  if (this._timerStarted) return;
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
  this.locked = true;

  if (this.mode === "solo") {
   const location = await this.generator.generate(this.area);
   return this.startRoundWithLocation(location);
  }

  if (this.playerId === "p1") {
   const location = await this.generator.generate(this.area);

   const roundIndex = (this.game.getState().rounds?.length || 0) + 1;

   this.network?.setRound({
    index: roundIndex,
    location,
    status: "running"
   });

   return this.startRoundWithLocation(location);
  }
 }

 startRoundFromNetwork(round) {
  if (this.playerId === "p1") return;
  this.startRoundWithLocation(round.location);
 }

 // =========================================================
 async startRoundWithLocation(location) {
  this._timerStarted = false;

  this.game.startRound(location);

 this._currentRound = {
   ...(this._currentRound || {}),
   location,
   status: "running"
  };

  this.emit("streetViewSetLocation", location);

  await this.waitForStreetViewReady();

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
 syncRoundFromNetwork(round) {
  if (!this._currentRound) this._currentRound = {};
  Object.assign(this._currentRound, round);
 }

 updateRound(patch) {
  if (this.playerId !== "p1") return;

  this.network?.setRound({
   ...this._currentRound,
   ...patch
  });
 }

 // =========================================================
 applyGuess(playerId, point) {
  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  const round = this.getCurrentRound();

  const guesses = round.guesses || {};

  this._currentRound = {
   ...round,
   guesses: {
    ...guesses,
    [playerId]: result
   }
  };

  this.emit("guessResolved", result);
 }

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

  this._roundFinishing = false;
 }

 finishRoundFromState() {
  if (this._roundFinishing) return;

  this.finishRound("networkFinish");
 }

 // STREET VIEW
 waitForStreetViewReady() {
  return new Promise(res => {
   this._resolveStreetViewReady = res;
  });
 }

 streetViewReady() {
  this._resolveStreetViewReady?.();
  this._resolveStreetViewReady = null;
 }

 //UI LOCK
 lockRoundUI() {
  this.locked = true;
  this.emit("inputLocked");
  this.emit("loadingStarted");
 }

 finishGuess(point) {
  return this.applyGuess(this.playerId, point);
 }
}
