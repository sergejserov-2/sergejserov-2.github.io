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
 }

 setScreen(screen) {
  this.uiState.setScreen(screen);
  this.staticUI.setScreen(screen);
 }

 bind() {

  this.gameFlow.on("gameStarted", () => {
   this.setScreen("round");
  });

  this.gameFlow.on("roundStarted", ({ round, actual }) => {
   this.setScreen("round");

   const hud = this.uiBuilder.buildHUD(
    this.gameFlow.game.state,
    round
   );

   this.staticUI.updateHUD(hud);

   this.streetViewUI.setLocation(actual);
   this.mapUI.reset();
  });

  this.gameFlow.on("guessUpdated", ({ guess }) => {
   this.mapUI.placeGuessMarker(guess);
  });

  this.gameFlow.on("guessFinished", ({ result }) => {
   this.setScreen("result");

   const vm = this.uiBuilder.buildRoundVM(
    this.gameFlow.game.state,
    this.gameFlow.game.state.getCurrentRound()
   );

   this.staticUI.showRoundResult(vm);

   this.mapUI.renderOverview({
    guess: result.guess,
    actual: result.actual
   });
  });

  this.gameFlow.on("roundCommitted", () => {
   // UI ничего не делает напрямую
  });

  this.gameFlow.on("gameEnded", () => {
   this.setScreen("result");

   const vm = this.uiBuilder.buildGameVM(this.gameFlow.game.state);

   this.staticUI.showGameResult(vm);
  });
 }
}
