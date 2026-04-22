export class GameBridge {
  constructor({ mode = "local", gameFlow, network = null }) {
    this.mode = mode;
    this.gameFlow = gameFlow;
    this.network = network;

    this.listeners = new Map();

    this.bindGameFlow();
    this.bindNetwork();
  }

  // =========================
  // EVENTS (для UIFlow)
  // =========================
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event).push(handler);
  }

  emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    handlers.forEach(h => h(payload));
  }

  // =========================
  // GAMEFLOW → UI прокси
  // =========================
  bindGameFlow() {
    const events = [
      "loadingStarted",
      "loadingFinished",
      "streetViewSetLocation",
      "roundStarted",
      "timerTick",
      "movesUpdated",
      "movesLocked",
      "inputLocked",
      "inputUnlocked",
      "roundResultShown",
      "gameEnded"
    ];

    events.forEach(event => {
      this.gameFlow.on(event, (payload) => {
        this.emit(event, payload);
      });
    });
  }

  // =========================
  // NETWORK → GAMEFLOW
  // =========================
  bindNetwork() {
    if (this.mode !== "multiplayer" || !this.network) return;

    this.network.on("stateSync", (state) => {
      this.gameFlow.applyState(state);
    });
  }

  // =========================
  // UI → GAME
  // =========================
  startGame() {
    if (this.mode === "local") {
      this.gameFlow.startGame();
    } else {
      this.network.send("startGame");
    }
  }

  submitGuess(point) {
    if (this.mode === "local") {
      this.gameFlow.submitGuess(point);
    } else {
      this.network.send("submitGuess", point);
    }
  }

  nextRound() {
    if (this.mode === "local") {
      this.gameFlow.nextRound();
    } else {
      this.network.send("nextRound");
    }
  }

  streetViewReady() {
    this.gameFlow.streetViewReady();
  }

  registerMove() {
    this.gameFlow.registerMove();
  }
}
