export class UIFlow {
 constructor({
  gameFlow,
  mapUI,
  streetViewUI,
  staticUI,
  uiState,
  uiBuilder
 }) {
  this.gameFlow = gameFlow;
  this.mapUI = mapUI;
  this.streetViewUI = streetViewUI;
  this.staticUI = staticUI;

  this.uiState = uiState;
  this.uiBuilder = uiBuilder;

  this.bind();
  this.connectInput();
 }

 setScreen(screen) {
  this.uiState.setScreen(screen);
  this.staticUI.setScreen(screen);
 }

 connectInput() {

  // 📍 выбор точки
  this.mapUI.bindGuess((point) => {
   this.gameFlow.onGuess("p1", point);
  });

  // 🎯 кнопка "Сделать выбор"
  const btn = document.getElementById("makeGuess");

  if (btn) {
   btn.addEventListener("click", () => {
    this.gameFlow.finishGuess("p1");
   });
  }
 }

 bind() {

  this.gameFlow.on("gameStarted", () => {
   this.setScreen("round");
  });

  this.gameFlow.on("roundStarted", ({ round, actual }) => {
   this.setScreen("round");

   const hud = this.uiBuilder.buildHUD(round);

   this.staticUI.updateHUD(hud);

   this.streetViewUI.setLocation(actual);
   this.mapUI.reset();
  });

  this.gameFlow.on("guessUpdated", ({ guess }) => {
   this.mapUI.placeGuessMarker(guess);
  });

  this.gameFlow.on("guessFinished", ({ result, round }) => {
   this.setScreen("result");

   const vm = this.uiBuilder.buildRoundVM(round, result);

   this.staticUI.showRoundResult(vm);

   this.mapUI.renderOverview(round);
  });

  this.gameFlow.on("gameEnded", ({ state }) => {
   this.setScreen("result");

   const vm = this.uiBuilder.buildGameVM(state);

   this.staticUI.showGameResult(vm);
  });
 }
}
