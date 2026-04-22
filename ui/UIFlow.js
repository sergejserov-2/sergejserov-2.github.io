
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
  // GAME START / LOADING
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

   this.staticUI.stopRoundTimer?.();

   this.staticUI.updateHUD(
    this.uiBuilder.formatGameVM(state)
   );
  });

  // =========================
  // TIMER (из TimerService через GameFlow)
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
  // INPUT LOCKING
  // =========================
  this.gameFlow.on("inputLocked", () => {
   this.staticUI.lockInput?.();
   this.mapWrapperUI.lock();

   // 🔥 важно для мультиплеера:
   // игрок, который сделал guess → уходит в WAIT screen
   this.screenManager.show("loading");
  });

  this.gameFlow.on("inputUnlocked", () => {
   this.staticUI.unlockInput?.();
   this.mapWrapperUI.unlock();
  });

  // =========================
  // GUESS RESOLVED (мультиплеерный хук)
  // =========================
  this.gameFlow.on("guessResolved", () => {
   // UI уже заблокирован в loading
   this.screenManager.show("loading");
  });

  // =========================
  // ROUND RESULT
  // =========================
  this.gameFlow.on("roundResultShown", ({ state }) => {
   this.screenManager.show("roundResult");

   const vm = this.uiBuilder.formatRoundVM(state);
   this.staticUI.showRoundResult(vm);

   const rounds = state.rounds || [];
   const round = rounds[rounds.length - 1];
   if (!round) return;

   this.roundOverviewUI.render(round);

   this.staticUI.startRoundDelay(10000, () => {
    this.gameFlow.nextRound();
   });
  });

  // =========================
  // GAME END
  // =========================
  this.gameFlow.on("gameEnded", (state) => {
   this.screenManager.show("gameResult");

   const vm = this.uiBuilder.formatGameResultVM(state);
   this.staticUI.showGameResult(vm);

   const rounds = state.rounds || [];
   const last = rounds[rounds.length - 1];

   if (last) {
    this.gameOverviewUI.render(last);
   }

   this.bindGameResultButtons();
  });
 }

 // =========================
 // GAME RESULT BUTTONS
 // =========================
 bindGameResultButtons() {
  if (this.boundGameResultButtons) return;
  this.boundGameResultButtons = true;

  const root = document.querySelector(".game-result");
  if (!root) return;

  const playAgain = root.querySelector(".play-again-button");
  const home = root.querySelector(".home-button");

  playAgain?.addEventListener("click", () => {
   this.gameFlow

.startGame();
  });

  home?.addEventListener("click", () => {
   window.location.href = "index.html";
  });
 }
}
