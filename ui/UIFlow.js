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

  this.gameFlow.on("roundStarted", (vm) => {
   this.screenManager.show("round");

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

  this.gameFlow.on("roundEnded", (vm) => {
   const round = vm?.rounds?.[vm.currentRoundIndex];
   if (!round) return;

   this.mapUI?.renderOverview(round);

   this.screenManager.show("roundResult");

   this.staticUI.showRoundResult(
    this.uiBuilder.formatRoundVM(vm)
   );
  });

  this.gameFlow.on("inputLocked", () => {
   this.staticUI.lockInput?.();
   this.mapUI?.lock();
  });

  this.gameFlow.on("inputUnlocked", () => {
   this.staticUI.unlockInput?.();
   this.mapUI?.unlock();
  });

  this.gameFlow.on("gameEnded", (vm) => {
   this.screenManager.show("gameResult");

   this.staticUI.showGameResult(
    this.uiBuilder.formatGameResultVM(vm)
   );
  });
 }
}
