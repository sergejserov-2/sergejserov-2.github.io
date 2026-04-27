export class UIFlow {
 constructor({
  gameFlow,
  screenManager,
  staticUI,
  uiBuilder,
  streetViewUI,
  mapWrapperUI,
  roundOverviewUI,
  gameOverviewUI
 }) {
  this.gameFlow = gameFlow;
  this.screenManager = screenManager;
  this.staticUI = staticUI;
  this.uiBuilder = uiBuilder;
  this.streetViewUI = streetViewUI;
  this.mapWrapperUI = mapWrapperUI;

  this.roundOverviewUI = roundOverviewUI;
  this.gameOverviewUI = gameOverviewUI;

  this.boundGameResultButtons = false;

  this.bind();
 }

 bind() {
  // =========================
  // STREET VIEW
  // =========================
  this.streetViewUI.onReady = () => {
   this.gameFlow.streetViewReady();
  };

  this.streetViewUI.onMove = () => {
   this.gameFlow.registerMove();
  };

  // =========================
  // LOADING
  // =========================
  this.gameFlow.on("loadingStarted", () => {
   this.screenManager.show("loading");
  });

  this.gameFlow.on("loadingFinished", () => {
   this.screenManager.show("round");
  });

  this.gameFlow.on("streetViewSetLocation", (location) => {
   this.streetViewUI.setLocation(location);
  });

  // =========================
  // ROUND START
  // =========================
  this.gameFlow.on("roundStarted", (state) => {
   this.mapWrapperUI.reset();
   this.streetViewUI.unlockMove();

   this.roundOverviewUI?.clear();
   this.gameOverviewUI?.clear();

   this.staticUI.stopRoundDelay?.();
   this.staticUI.resetHUD();
   const totals = this.gameFlow.getTotalScore();
   const myScore = totals[this.gameFlow.playerId] || 0;
   this.staticUI.updateHUD({
     ...this.uiBuilder.formatGameVM(state),
     totalScore: myScore
   });
  });

  // =========================
  // MAIN TIMER
  // =========================
  this.gameFlow.on("timerTick", (t) => {
   this.staticUI.updateTimer(t);
  });

  // =========================
  // MOVES
  // =========================
  this.gameFlow.on("movesUpdated", (m) => {
   this.staticUI.updateMoves?.(m);
  });

  this.gameFlow.on("movesLocked", () => {
   this.streetViewUI.lockMove();
  });

  // =========================
  // INPUT LOCK
  // =========================
  this.gameFlow.on("inputLocked", () => {
   this.staticUI.lockInput?.();
   this.mapWrapperUI.lock();
  });

  this.gameFlow.on("inputUnlocked", () => {
   this.staticUI.unlockInput?.();
   this.mapWrapperUI.unlock();
  });

  // =========================
  // WAITING (DUEL)
  // =========================
this.gameFlow.on("roundWaiting", () => {
  this.screenManager.show("waiting");
});

  this.gameFlow.on("roundTimerTick", (t) => {
   this.staticUI.updateRoundTimer?.(t);
  });

  // =========================
  // ROUND RESULT (GUESS ONLY PIPELINE)
  // =========================
this.gameFlow.on("roundResultShown", ({ state, round }) => {
  this.screenManager.show("roundResult");
  const guessesArray = Array.isArray(round.guesses)
    ? round.guesses
    : Object.values(round.guesses || {});

  const totals = this.gameFlow.getTotalScore();

  const vm = {
    actual: round.actualLocation,
    guesses: guessesArray,
    players: totals // 🔥 ВАЖНО
  };

  console.log("🎯 UI VM", vm);
  this.staticUI.showRoundResult(vm);
  requestAnimationFrame(() => {
    this.roundOverviewUI.render({
      actualLocation: round.actualLocation,
      guesses: guessesArray
    });
  });
  this.staticUI.startRoundDelay(10000, () => {
    this.gameFlow.nextRound();
  });
});

this.gameFlow.on("gameEnded", ({ state, round }) => {
  this.screenManager.show("gameResult");

  const guessesArray = Array.isArray(round.guesses)
    ? round.guesses
    : Object.values(round.guesses || {});

  const totals = this.gameFlow.getTotalScore();

  const vm = {
    actual: round.actualLocation,
    guesses: guessesArray,
    players: totals // 🔥 ВАЖНО
  };

  console.log("🎯 UI VM", vm);

  this.staticUI.showGameResult(vm);

  requestAnimationFrame(() => {
    this.roundOverviewUI.render({
      actualLocation: round.actualLocation,
      guesses: guessesArray
    });
  });

  this.bindGameResultButtons();
});
 }
 // =========================
 // BUTTONS
 // =========================
 bindGameResultButtons() {
  if (this.boundGameResultButtons) return;
  this.boundGameResultButtons = true;

  const root = document.querySelector(".game-result");
  if (!root) return;

  const playAgain = root.querySelector(".play-again-button");
  const home = root.querySelector(".home-button");

  playAgain.addEventListener("click", () => {
   this.gameFlow.startGame();
  });

 home.addEventListener("click", () => {
   window.location.href = "index.html";
  });
 }
}
