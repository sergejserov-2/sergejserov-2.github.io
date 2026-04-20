export class GameFlow {
  constructor({ game, generator, area, services }) {
    this.game = game;
    this.generator = generator;
    this.area = area;

    this.timer = services.timer;
    this.moves = services.moves;
    this.rounds = services.rounds;

    this.listeners = {};
    this.locked = false;
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
  // START GAME
  // =========================
  async startGame() {
    this.game.startGame();

    this.rounds.start(this.game.config.rules.rounds);

    this.emit("gameStarted", this.game.getState());

    await this.startRound();
  }

  // =========================
  // START ROUND
  // =========================
  async startRound() {
    this.locked = true;
    this.emit("inputLocked");

    const location = await this.generator.generate(this.area);

    this.game.startRound(location);

    // reset services
    this.moves.reset(this.game.config.rules.moves);

    this.timer.start(
      this.game.config.rules.time,
      () => this.finishRound("timeout"),
      (t) => this.emit("timerTick", t)
    );

    this.locked = false;

    this.emit("inputUnlocked");
    this.emit("roundStarted", this.game.getState());
    this.emit("stateUpdated", this.game.getState());
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

    this.game.setGuess(playerId, point);
    this.game.finishGuess(playerId);

    this.emit("roundEnded", this.game.getState());
    this.emit("stateUpdated", this.game.getState());
  }

  // =========================
  // FINISH ROUND
  // =========================
  finishRound(reason = "manual") {
    this.timer.clear();

    this.locked = true;
    this.emit("inputLocked");

    this.game.commitRound();

    this.emit("roundEndedReason", reason);
    this.emit("roundEnded", this.game.getState());

    if (this.rounds.isFinished()) {
      this.endGame();
      return;
    }

    // ⚠️ ВАЖНО:
    // мы НЕ вызываем nextRound автоматически
    // UI решает когда продолжить

    this.emit("awaitNextRound", this.game.getState());
  }

  // =========================
  // NEXT ROUND (manual trigger)
  // =========================
  async nextRound() {
    this.rounds.next();

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
