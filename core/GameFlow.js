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

  this.locked = false;
  this.roundLocked = false;

  this.finishedPlayers = new Set();

  this._started = false;
  this._pendingRound = null;

  this._resolveStreetView = null;

  this.bindNetwork();
 }

 // =========================
 // EVENTS
 // =========================
 on(e, cb) {
  (this.listeners[e] ||= []).push(cb);
 }

 emit(e, d) {
  this.listeners[e]?.forEach(cb => cb(d));
 }

 // =========================
 // NETWORK
 // =========================
 bindNetwork() {
  if (!this.network) return;

  this.network.onRoom?.((state) => {
   const game = state.game;
   if (!game) return;

   // START
   if (game.started && !this._started) {
    this._started = true;
    this.game.startGame();
    this.emit("gameStarted", this.game.getState());
   }

   // ROUND SYNC
   if (game.round) {
    this.receiveRound(game.round);
   }
  });
 }

 // =========================
 // SOLO + DUEL ENTRY
 // =========================
 startGame() {
  if (this.mode === "duel") return;

  this._started = true;
  this.game.startGame();
  this.startRound();
 }

 startGameFromNetwork() {
  if (this._started) return;

  this._started = true;
  this.game.startGame();
  this.emit("gameStarted", this.game.getState());
 }

 // =========================
 // ROUND START
 // =========================
 async startRound() {
  this.locked = true;

  if (this.mode === "solo") {
   const loc = await this.generator.generate(this.area);
   return this.startRoundWithLocation(loc);
  }

  if (this.playerId === "p1") {
   const loc = await this.generator.generate(this.area);

   const round = {
    index: (this.game.getState().rounds?.length || 0) + 1,
    location: loc,
    status: "running"
   };

   await this.network?.setRound(round);

   return this.startRoundWithLocation(loc);
  }

  // guest waits
  const loc = await new Promise(res => {
   this._pendingRound = res;
  });

  return this.startRoundWithLocation(loc);
 }

 receiveRound(round) {
  if (this.playerId === "p1") return;

  if (this._pendingRound) {
   this._pendingRound(round.location);
   this._pendingRound = null;
  } else {
   this._pendingRound = round.location;
  }
 }

 // =========================
 // CORE ROUND
 // =========================
 async startRoundWithLocation(location) {
  this.game.startRound(location);

  this.emit("streetViewSetLocation", location);

  await this.waitStreetView();

  this.timer.start(
   this.game.config.rules.time,
   () => this.finishRound("timeout"),
   (t) => this.emit("timerTick", t)
  );

  this.moves.reset(this.game.config.rules.moves);

  this.locked = false;

  this.emit("roundStarted", this.game.getState());
 }

 waitStreetView() {
  return new Promise(res => {
   this._resolveStreetView = res;
  });
 }

 streetViewReady() {
  this._resolveStreetView?.();
  this._resolveStreetView = null;
 }

 // =========================
 // GUESS
 // =========================
 finishGuess(point) {
  if (this.locked) return;

  if (this.mode === "duel") {
   this.network?.sendGuess?.({ playerId: this.playerId, guess: point });
  }

  this.applyGuess(this.playerId, point);
 }

 applyGuess(playerId, point) {
  const res = this.game.setGuess(playerId, point);
  if (!res) return;

  this.game.applyResult(res);

  this.emit("guessResolved", res);

  if (this.mode === "solo") {
   this.finishRound();
  }
 }

 // =========================
 // MOVES
 // =========================
 registerMove() {
  if (this.locked) return;

  this.moves.consume();
  this.emit("movesUpdated", this.moves.getRemaining());
 }

 // =========================
 // END ROUND
 // =========================
 finishRound() {
  this.timer.clear();
  this.roundTimer.clear();
this.locked = true;

  this.emit("roundEnded", this.game.getState());
 }

 // legacy safety
 lockRoundUI() {
  this.locked = true;
  this.emit("inputLocked");
 }
}
