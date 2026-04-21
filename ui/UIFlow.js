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

   this.roundOverviewUI?.clear();
   this.gameOverviewUI?.clear();

   this.staticUI.stopRoundTimer?.();

   this.staticUI.updateHUD(
    this.uiBuilder.formatGameVM(state)
   );
  });

  // =========================
  // TIMER / MOVES
  // =========================
  this.gameFlow.on("timerTick", (t) => {
   this.staticUI.updateTimer(t);
  });

  this.gameFlow.on("movesUpdated", (m) => {
   this.staticUI.updateMoves?.(m);
  });

  // =========================
  // INPUT
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
  // ROUND RESULT
  // =========================
  this.gameFlow.on("roundResultShown", ({ state }) => {

   const rounds = state.rounds || [];
   const round = rounds[rounds.length - 1];
   if (!round) return;

   this.roundOverviewUI.render(round);

   const vm = this.uiBuilder.formatRoundVM(state);

   this.screenManager.show("roundResult");
   this.staticUI.showRoundResult(vm);

   const duration = 7500;

   requestAnimationFrame(() => {
    this.roundOverviewUI.forceResize?.();
   });

   this.staticUI.startRoundDelay(duration, () => {
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
    requestAnimationFrame(() => {
     this.gameOverviewUI.render(last);
     this.gameOverviewUI.forceResize?.();
    });
   }

   // =========================
   // BUTTONS
   // =========================
   const root = document.querySelector(".game-result");

   const playAgain = root?.querySelector(".play-again-button");
   const home = root?.querySelector(".home-button");

   playAgain?.addEventListener("click", () => {
    this.gameFlow.startGame();
   });

   home?.addEventListener("click", () => {
    window.location.href = "index.html";
   });
  });
 }
}
