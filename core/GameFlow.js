export class GameFlow {
  constructor({ game, generator, area, services }) {
    this.game = game;
    this.generator = generator;
    this.area = area;

    this.timer = services.timer;
    this.moves = services.moves;
    this.rounds = services.rounds; // только totalRounds

    this.listeners = {};
    this.locked = false;

    this._resolveStreetViewReady = null;
  }

  // =========================
  // EVENTS
  // =========================
  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  emit(event, data) {
    const list = this.listeners[event];
    if (!list) return;
    list.forEach(cb => cb(data));
  }

  // =========================
  // GAME START
  // =========================
  async startGame() {
    this.game.startGame();

    this.rounds.start(this.game.config.rules.rounds);

    this.emit("gameStarted", this.game.getState());

    await this.startRound();
  }

  // =========================
  // ROUND START
  // =========================
  async startRound() {
    this.locked = true;

    this.emit("inputLocked");
    this.emit("loadingStarted");

    const location = await this.generator.generate(this.area);

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

    this.emit("inputUnlocked");
    this.emit("roundStarted", this.game.getState());
    this.emit("stateUpdated", this.game.getState());
  }

  // =========================
  // STREETVIEW SYNC
  // =========================
  waitForStreetViewReady() {
    return new Promise(resolve => {
      this._resolveStreetViewReady = resolve;
    });
  }

  streetViewReady() {
    if (this._resolveStreetViewReady) {
      this._resolveStreetViewReady();
      this._resolveStreetViewReady = null;
    }
  }

  // =========================
  // USER ACTION
  // =========================
  finishGuess(point, playerId = "p1") {
    if (this.locked) return;

    const canMove = this.moves.consume();
    this.emit("movesUpdated", this.moves.getRemaining());

    if (!canMove) {
      this.finishRound("moves");
      return;
    }

    this.locked = true;
    this.emit("inputLocked");

    // =========================
    // 1. SET GUESS
    // =========================
    this.game.setGuess(playerId, point);

    // =========================
    // 2. CALCULATE SCORE
    // =========================
    const result = this.game.finishGuess(playerId);

    this.emit("guessResolved", result);

    // =========================
    // 3. FINISH ROUND
    // =========================
    this.finishRound("guess");

    this.emit("stateUpdated", this.game.getState());
  }

  // =========================
  // FINISH ROUND
  // =========================
  finishRound(reason = "manual") {
    this.timer.clear();

    this.locked = true;
    this.emit("inputLocked");

    const stateBefore = this.game.getState();

    // =========================
    // COMMIT ROUND (ЕДИНСТВЕННОЕ МЕСТО)
    // =========================
    this.game.commitRound();

    const stateAfter = this.game.getState();

    this.emit("roundEnded", stateAfter);
    this.emit("roundEndedReason", reason);

    // =========================
    // CHECK END GAME
    // =========================
    const isLastRound = this.rounds.isFinished(
      stateAfter.currentRoundIndex
    );

    if (isLastRound) {
      this.endGame();
      return;
    }

    this.emit("roundResultShown", {
      state: stateAfter,
      reason
    });
  }

  // =========================
  // NEXT ROUND
  // =========================
  async nextRound() {
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
    this.timer.clear();

    this.game.endGame();

    this.emit("gameEnded", this.game.getState());
  }
}
