this.emit("timerStarted");
    }
   }

   // =========================
   // FINISHED STATE
   // =========================
   if (round.status === "finished" && !this._roundFinishing) {

    this._timerStarted = false;

    this.emit("timerStopped");

    this.finishRoundFromState("networkFinish");
   }
  });
 }

 // =========================
 // GAME START
 // =========================
 startGame() {
  if (this._started) return;

  this._started = true;
  this.game.startGame();
  this.emit("gameStarted", this.game.getState());

  this.startRound();
 }

 // =========================
 // ROUND START (HOST)
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

  this.moveslocked = false;

  this.emit("roundStarted", this.game.getState());
 }

 // =========================
 // GUESSES
 // =========================
 applyGuess(playerId, point) {
  if (this.locked) return;

  const result = this.game.setGuess(playerId, point);
  if (!result) return;

  this.emit("guessResolved", result);
  this.network.updateGuess(playerId, result);

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

  this.emit("timerStopped");

  const round = this.getRoundForUI();
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

 // =========================
 // NEXT ROUND
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
  if (this.moveslocked) return;

  const ok = this.moves.consume();

  this.emit("movesUpdated", this.moves.getRemaining());

  if (!ok) {
   this.moveslocked = true;
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
