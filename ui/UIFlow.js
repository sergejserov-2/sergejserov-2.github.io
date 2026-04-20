export class UIFlow {
 constructor({ gameFlow, screenManager, staticUI, uiBuilder, streetViewUI }) {
  this.gameFlow = gameFlow;
  this.screenManager = screenManager;
  this.staticUI = staticUI;
  this.uiBuilder = uiBuilder;
  this.streetViewUI = streetViewUI;

  this.bind();
 }

 bind() {

  this.gameFlow.on("gameStarted", (vm) => {
   this.screenManager.show("round");
   this.staticUI.updateHUD(this.uiBuilder.formatHUD(vm));
  });

  this.gameFlow.on("stateUpdated", (vm) => {
   this.staticUI.updateHUD(this.uiBuilder.formatHUD(vm));
  });

  this.gameFlow.on("inputLocked", () => {
   this.staticUI.lockInput?.();
  });

  this.gameFlow.on("inputUnlocked", () => {
   this.staticUI.unlockInput?.();
  });

  this.gameFlow.on("roundStarted", (vm) => {
   this.screenManager.show("round");
   this.staticUI.updateHUD(this.uiBuilder.formatHUD(vm));

   // 🔥 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ
   const location = vm?.rounds?.[vm.currentRoundIndex]?.actualLocation;
   if (location) {
    this.streetViewUI?.setLocation(location);
   }
  });

  this.gameFlow.on("roundEnded", (vm) => {
   this.screenManager.show("roundResult");

   this.staticUI.showRoundResult(
    this.uiBuilder.formatRoundResult(vm)
   );
  });

  this.gameFlow.on("gameEnded", (vm) => {
   this.screenManager.show("gameResult");

   this.staticUI.showGameResult(
    this.uiBuilder.formatGameResult(vm)
   );
  });
 }
}
