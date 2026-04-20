export class UIFlow {
 constructor({ gameFlow, screenManager, staticUI, uiBuilder }) {
  this.gameFlow = gameFlow;
  this.screenManager = screenManager;
  this.staticUI = staticUI;
  this.uiBuilder = uiBuilder;

  this.bind();
 }

 bind() {

  this.gameFlow.on("gameStarted", (state) => {
   const vm = this.uiBuilder.formatGameVM(state);

   this.screenManager.show("round");
   this.staticUI.updateHUD(vm);
  });

  this.gameFlow.on("stateUpdated", (state) => {
   const vm = this.uiBuilder.formatGameVM(state);

   this.staticUI.updateHUD(vm);
  });

  this.gameFlow.on("inputLocked", () => {
   this.staticUI.lockInput?.();
  });

  this.gameFlow.on("inputUnlocked", () => {
   this.staticUI.unlockInput?.();
  });

  this.gameFlow.on("roundEnded", (state) => {
   const vm = this.uiBuilder.formatRoundVM(state);

   this.screenManager.show("roundResult");
   this.staticUI.showRoundResult(vm);
  });

  this.gameFlow.on("gameEnded", (state) => {
   const vm = this.uiBuilder.formatGameResultVM(state);

   this.screenManager.show("gameResult");
   this.staticUI.showGameResult(vm);
  });
 }
}
