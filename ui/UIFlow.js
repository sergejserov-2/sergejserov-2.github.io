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
  // STREET VIEW READY SYNC 🔥
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
  // SET STREET VIEW LOCATION 🔥
  // =========================
  this.gameFlow.on("streetViewSetLocation", (loc) => {
   this.streetViewUI.setLocation(loc);
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
   this.staticUI.updateTimer?.(t);
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
  // ROUND END
  // =========================
  this.gameFlow.on("roundEnded", (vm) => {

   const round = vm?.rounds?.[vm.currentRoundIndex - 1];
   if (!round) return;

   this.mapOverviewUI.render(round);

   this.screenManager.show("roundResult");

   this.staticUI.showRoundResult(
    this.uiBuilder.formatRoundVM(vm)
   );
  });

  // =========================
  // ROUND RESULT SHOWN (UX HOOK)
  // =========================
  this.gameFlow.on("roundResultShown", () => {
   // тут можно повесить таймер или кнопку next
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
