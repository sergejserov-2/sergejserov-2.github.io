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
  this._started = false;
  this._roundFinishing = false;
  this._timerStarted = false;

  this._currentRound = null;

  this._resolveStreetViewReady = null;

  this.bindNetwork();
 }

 // EVENTS
 on(event, cb) {
  if (!this.listeners[event]) {
   this.listeners[event] = [];
  }
  this.listeners[event].push(cb);
 }

 emit(event, data) {
  const cbs = this.listeners[event];
  if (!cbs) return;

  for (let i = 0; i < cbs.length; i++) {
   cbs[i](data);
  }
 }

 // ROUND MODEL
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
   index: r.index,
   status: r.status,
   actualLocation: r.actualLocation,
   initiator: r.initiator,
   guesses: r.guesses || {}
  };
 }

 // NETWORK
 bindNetwork() {
  if (!this.network) return;

  this.network.onRoom((room) => {

   const game = room.game;
   if (!game) return;

   const round = game.round;
   if (!round) return;

   if (game.started && !this._started) {
    this._started = true;
    this.game.startGame();
    this.emit("gameStarted", this.game.getState());
   }

   this.setCurrentRound(round);
   const current = this.getCurrentRound();
   if (this.playerId !== "p1") {

    const canStart =
     current.index !== this._currentRoundIndex &&
     current.actualLocation;

    if (canStart) {
     this._currentRoundIndex = current.index;

     this.startRoundWithLocation(current.actualLocation);
    }
   }

   if (current.status === "waiting") {

    const isInitiator = this.playerId === current.initiator;

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

   const guessCount = Object.keys(current.guesses).length;

   if (
    this.playerId === "p1" &&
    current.status !== "finished" &&
    guessCount >= this.game.players.length
   ) {
    this.updateRound({ status: "finished" });
   }

   if (current.status === "finished" && !this._roundFinishing) {
    this._timerStarted = false;
    this.finishRoundFromState("networkFinish");
   }
  });
 }

 // GAME START
 startGame() {
  if (this._started) return;

  this._started = true;
this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  this.startRound();
 }

 // ROUND START (HOST)
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

 // CORE ROUND
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

 // GUESSES
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

  const next = this.normalizeRound({
   ...round,
   guesses
  });

  this.setCurrentRound(next);

  if (!round.initiator) {
   this.updateRound({
    ...next,
    initiator: playerId,
    status: "waiting"
   });
   return;
  }

  this.updateRound(next);
 }

 updateRound(patch) {
  if (this.playerId !== "p1") return;
  if (!this.network?.setRound) return;

  const next = this.normalizeRound({
   ...this.getCurrentRound(),
   ...patch
  });

  this.setCurrentRound(next);

  this.network.setRound(next);
 }

 // FINISH
 finishRound(reason) {

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

 // MOVES
 registerMove() {
  if (this.locked) return;

  const ok = this.moves.consume();

  this.emit("movesUpdated", this.moves.getRemaining());

  if (!ok) {
   this.locked = true;
   this.emit("movesLocked");
  }
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

 lockRoundUI() {
  this.locked = true;
  this.emit("inputLocked");

 }
 
 finishGuess(point) {
  return this.applyGuess(this.playerId, point);
 }
}
