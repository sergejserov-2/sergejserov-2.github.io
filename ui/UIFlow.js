export class UIFlow {
 constructor({ gameFlow, screenManager, staticUI, uiBuilder }) {
  this.gameFlow = gameFlow;
  this.screenManager = screenManager;
  this.staticUI = staticUI;
  this.uiBuilder = uiBuilder;

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

  this.gameFlow.on("inputLocked", () => {});

  this.gameFlow.on("inputUnlocked", () => {});

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
