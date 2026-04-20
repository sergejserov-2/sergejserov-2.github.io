export class UIFlow {
 constructor({
  gameFlow,
  mapUI,
  streetViewUI,
  staticUI,
  screenManager,
  uiBuilder
 }) {
  this.gameFlow = gameFlow;
  this.mapUI = mapUI;
  this.streetViewUI = streetViewUI;

  this.staticUI = staticUI;
  this.screenManager = screenManager;

  this.uiBuilder = uiBuilder;

  this.bind();
  this.connectInput();
 }

 setScreen(screen) {
  this.screenManager.setScreen(screen);
  this.staticUI.setScreen(screen);
 }

 connectInput() {
  this.mapUI.bindGuess((point) => {
   this.gameFlow.onGuess("p1", point);
  });

  const btn = document.getElementById("makeGuess");

  if (btn) {
   btn.addEventListener("click", () => {
    this.gameFlow.finishGuess("p1");
   });
  }
 }

 bind() {

  this.gameFlow.on("gameStarted", (vm) => {
   this.setScreen("round");
   this.staticUI.updateHUD(this.uiBuilder.formatHUD(vm));
  });

  this.gameFlow.on("roundStarted", (vm) => {
   this.setScreen("round");

   this.staticUI.updateHUD(this.uiBuilder.formatHUD(vm));

   this.streetViewUI.setLocation(vm.actualLocation);
   this.mapUI.reset();
  });

  this.gameFlow.on("guessUpdated", ({ point }) => {
   this.mapUI.placeGuessMarker(point);
  });

  this.gameFlow.on("guessFinished", (vm) => {
   this.setScreen("result");

   this.staticUI.showRoundResult(
    this.uiBuilder.formatResult(vm)
   );
  });

  this.gameFlow.on("roundEndFinished", () => {
   this.setScreen("round");
  });

  this.gameFlow.on("gameEnded", (vm) => {
   this.setScreen("result");

   this.staticUI.showGameResult(
    this.uiBuilder.formatGame(vm)
   );
  });
 }
}
