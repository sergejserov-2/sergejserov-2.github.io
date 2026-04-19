export class UIFlow {
 constructor({
  game,
  gameFlow,
  mapUI,
  streetViewUI,
  staticUI,
  uiState,
  uiBuilder
 }) {
  this.game = game;
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

  /* GAME START */
  this.game.on("gameStarted", () => {
   this.setScreen("round");
  });

  /* ROUND START */
  this.game.on("roundStarted", ({ round, actual }) => {

   this.setScreen("round");

   const hud = this.uiBuilder.buildHUD(
    this.game.state,
    this.game.state.getCurrentRound()
   );

   this.staticUI.updateHUD(hud);

   this.streetViewUI.setLocation(actual);
   this.mapUI.reset();
  });

  /* GUESS UPDATE */
  this.game.on("guessUpdated", ({ guess }) => {
   this.mapUI.placeGuessMarker(guess);
  });

  /* GUESS FINISHED */
  this.game.on("guessFinished", ({ result }) => {

   this.setScreen("result");

   const vm = this.uiBuilder.buildRoundVM(
    this.game.state,
    this.game.state.getCurrentRound()
   );

   this.staticUI.showRoundResult(vm);

   this.mapUI.renderOverview({
    guess: result.guess,
    actual: result.actual
   });
  });

  /* ROUND END */
  this.game.on("roundCommitted", () => {
   this.gameFlow.onRoundCommitted();
  });

  /* GAME END */
  this.game.on("gameEnded", () => {

   this.setScreen("result");

   const vm = this.uiBuilder.buildGameVM(this.game.state);

   this.staticUI.showGameResult(vm);
  });
 }
}
