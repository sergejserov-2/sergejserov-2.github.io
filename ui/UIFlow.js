export class UIFlow {
 constructor({ gameFlow, screenManager, staticUI, uiBuilder, streetViewUI, mapUI }) {
  this.gameFlow = gameFlow;
  this.screenManager = screenManager;
  this.staticUI = staticUI;
  this.uiBuilder = uiBuilder;
  this.streetViewUI = streetViewUI;
  this.mapUI = mapUI;

  this.bind();
 }

 bind() {

  // =========================
  // GAME START
  // =========================

  this.gameFlow.on("gameStarted", (vm) => {
   this.screenManager.show("round");

   this.staticUI.updateHUD(
    this.uiBuilder.formatGameVM(vm)
   );
  });

  // =========================
  // STATE UPDATE
  // =========================

  this.gameFlow.on("stateUpdated", (vm) => {
   this.staticUI.updateHUD(
    this.uiBuilder.formatGameVM(vm)
   );
  });

  // =========================
  // INPUT LOCK
  // =========================

  this.gameFlow.on("inputLocked", () => {
   this.staticUI.lockInput?.();
   this.mapUI?.lock();
  });

  this.gameFlow.on("inputUnlocked", () => {
   this.staticUI.unlockInput?.();
   this.mapUI?.unlock();
  });

  // =========================
  // ROUND START
  // =========================

  this.gameFlow.on("roundStarted", (vm) => {
   this.screenManager.show("round");

   // 🔥 очищаем UI перед новым раундом
   this.mapUI?.reset();

   this.staticUI.updateHUD(
    this.uiBuilder.formatGameVM(vm)
   );

   const location =
    vm?.rounds?.[vm.currentRoundIndex]?.actualLocation;

   if (location) {
    this.streetViewUI?.setLocation(location);
   }
  });

  // =========================
  // ROUND END
  // =========================

  this.gameFlow.on("roundEnded", (vm) => {
   this.screenManager.show("roundResult");

   this.staticUI.showRoundResult(
    this.uiBuilder.formatRoundVM(vm)
   );

   const roundIndex = vm.currentRoundIndex;
   const round = vm?.rounds?.[roundIndex];

   if (round && round.guesses?.length) {
    this.mapUI?.renderOverview(round);
   }
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
