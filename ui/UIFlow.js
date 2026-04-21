export class UIFlow {
 constructor({
  gameFlow,
  screenManager,
  staticUI,
  uiBuilder,
  streetViewUI,
  mapWrapperUI,
  mapOverviewUI
 }) {
  this.gameFlow = gameFlow;
  this.screenManager = screenManager;
  this.staticUI = staticUI;
  this.uiBuilder = uiBuilder;
  this.streetViewUI = streetViewUI;
  this.mapWrapperUI = mapWrapperUI;
  this.mapOverviewUI = mapOverviewUI;

  this.bind();
 }

 bind() {

  // =========================
  // STREET VIEW READY
  // =========================
  this.streetViewUI.onReady = () => {
   this.gameFlow.streetViewReady();
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

  // =========================
  // STREET VIEW LOCATION
  // =========================
  this.gameFlow.on("streetViewSetLocation", (location) => {
   this.streetViewUI.setLocation(location);
  });

  // =========================
  // ROUND START
  // =========================
  this.gameFlow.on("roundStarted", (vm) => {
   this.mapWrapperUI.reset();
   this.mapOverviewUI.clear();

   this.staticUI.stopRoundTimer?.();

   this.staticUI.updateHUD(
    this.uiBuilder.formatGameVM(vm)
   );
  });

  // =========================
  // TIMER
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
  // ROUND RESULT
  // =========================
  this.gameFlow.on("roundResultShown", ({ state }) => {

   const rounds = state.rounds || [];
   const round = rounds[rounds.length - 1];

   if (!round) return;

   this.mapOverviewUI.render(round);

   const vm = this.uiBuilder.formatRoundVM(state);

   this.screenManager.show("roundResult");
   this.staticUI.showRoundResult(vm);

   const duration = 7500;

   // 🔥 ВАЖНО: сначала даём карте перестроиться
   requestAnimationFrame(() => {
    this.mapOverviewUI.forceResize?.();
   });

   this.staticUI.startRoundTimer(duration, () => {
    this.gameFlow.nextRound();
   });
  });

  // =========================
  // GAME END
  // =========================
  this.gameFlow.on("gameEnded", (vm) => {
   this.screenManager.show("gameResult");

   this.staticUI.showGameResult(
    this.uiBuilder.formatGameResultVM(vm)
   );
  });
 }
}
