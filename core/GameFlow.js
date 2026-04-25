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

  // STATE
  this._started = false;
  this._roundFinishing = false;
  this._roundTransitioning = false;

  this._timerStarted = false;

  this._currentRound = null;

  this._roundIndex = null;
  this._lastFinishedRoundIndex = null;

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
 // NETWORK CORE (ЕДИНСТВЕННЫЙ ИСТОЧНИК ЖИЗНИ)
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

   // SYNC CORE
   this.game.syncRoundFromNetwork?.(current);
   this.setCurrentRound(current);

   const guesses = current.guesses || {};
   const guessKeys = Object.keys(guesses);
   const guessCount = guessKeys.length;

   const hasIndex = current.index != null;
   const hasLocation = current.actualLocation != null;

   // =========================
   // HOST LOGIC (ЕДИНСТВЕННОЕ МЕСТО ЗАПИСИ)
   // =========================
   if (this.playerId === "p1") {

    // INITIATOR
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

    // FINISH
    if (
     current.status !== "finished" &&
     guessCount >= this.game.players.length
    ) {
     this.updateRound({ status: "finished" });
    }
   }

   // =========================
   // 🔥 ROUND START (ДЛЯ ВСЕХ)
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
   // WAITING
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
   // FINISH (ОДИН РАЗ НА РАУНД)
   // =========================
   if (
    current.status === "finished" &&
    hasIndex &&
    this._lastFinishedRoundIndex !== current.index
   ) {
    this._lastFinishedRoundIndex = current.index;

    this._timerStarted = false;
    this.emit("timerStopped");
    this.finishRoundFromState("networkFinish");
   }
  });
 }

 // =========================
 // HOST: СОЗДАНИЕ РАУНДА
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

  // ❗ ТОЛЬКО СЕТЬ
  this.network.setRound(round);
 }

 // =========================
 // CORE START (UI ONLY)
 // =========================
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

  this.emit("roundStarted", this.game.getState());
 }

 // =========================
 // GUESSES
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
 // FINISH
 // =========================
 finishRound(reason) {
  if (this._roundFinishing) return;

  this._roundFinishing = true;

  this.timer.clear();
  this.roundTimer.clear();

  this._timerStarted = false;

  if (!this._resultShown) {
   this._resultShown = true;

   const round = this.getRoundForUI();
   const state = this.game.getState();

   this.emit("roundResultShown", {
    state,
    round,
    reason
   });
  }

  this._roundFinishing = false;
 }

 finishRoundFromState(reason) {
  if (this._roundFinishing) return;
  this.finishRound(reason);
 }

 // =========================
 // NEXT ROUND (HOST ONLY)
 // =========================
 async nextRound() {
  if (this.playerId !== "p1") return;
  if (this._roundTransitioning) return;

  this._roundTransitioning = true;

  this._resultShown = false;
  this._roundFinishing = false;

  this.timer.clear();
  this.roundTimer.clear();

  this._timerStarted = false;

  this.game.commitRound?.();

  if (this.game.isGameEnded()) {
   this.endGame();
   this._roundTransitioning = false;
   return;
  }

  await this.startRound();

  this._roundTransitioning = false;
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
   guesses: this.convertGuessesToArray(r.guesses)
  };
 }

 convertGuessesToArray(obj = {}) {
  return Object.entries(obj).map(([playerId, g]) => ({
   playerId,
   lat: g.lat ?? g.guess?.lat,
   lng: g.lng ?? g.guess?.lng,
   score: g.score ?? 0,
   distance: g.distance ?? 0
  }));
 }
}
