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

  this.gameFlow.on("roundStarted", (vm) => {
   this.screenManager.show("round");

   this.mapWrapperUI.reset();
   this.mapOverviewUI.clear();

   this.staticUI.updateHUD(
    this.uiBuilder.formatGameVM(vm)
   );

   const loc = vm?.rounds?.[vm.currentRoundIndex]?.actualLocation;

   if (loc) this.streetViewUI?.setLocation(loc);
  });

  this.gameFlow.on("roundEnded", (vm) => {
   const round = vm?.rounds?.[vm.currentRoundIndex];
   if (!round) return;

   this.mapOverviewUI.render(round);

   this.screenManager.show("roundResult");

   this.staticUI.showRoundResult(
    this.uiBuilder.formatRoundVM(vm)
   );
  });

  this.gameFlow.on("inputLocked", () => {
   this.staticUI.lockInput?.();
   this.mapWrapperUI.lock();
  });

  this.gameFlow.on("inputUnlocked", () => {
   this.staticUI.unlockInput?.();
   this.mapWrapperUI.unlock();
  });

  this.gameFlow.on("gameEnded", (vm) => {
   this.screenManager.show("gameResult");

   this.staticUI.showGameResult(
    this.uiBuilder.formatGameResultVM(vm)
   );
  });
 }
}
