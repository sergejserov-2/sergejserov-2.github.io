export class Bridge {
 constructor({
  game,
  gameFlow,
  mapUI,
  streetViewUI,
  staticUI,
  viewModelBuilder
 }) {
  this.game = game;
  this.gameFlow = gameFlow;
  this.mapUI = mapUI;
  this.streetViewUI = streetViewUI;
  this.staticUI = staticUI;
  this.vm = viewModelBuilder;

  this.uiState = {
   screen: "loading" // loading | round | result
  };

  this.bind();
 }

 setScreen(screen) {
  this.uiState.screen = screen;

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

   this.staticUI.updateHUD(
    this.vm.buildHUD(this.game.state, this.game.state.getCurrentRound())
   );

   this.streetViewUI.setLocation(actual);
   this.mapUI.reset();
  });

  /* GUESS UPDATE */
  this.game.on("guessUpdated", ({ playerId, guess }) => {
   this.mapUI.placeGuessMarker(guess);
  });

  /* GUESS FINISHED */
  this.game.on("guessFinished", ({ result }) => {

   this.setScreen("result");

   const vm = this.vm.buildRoundVM(
    this.game.state,
    this.game.state.getCurrentRound()
   );

   this.staticUI.showRoundResult(vm);

   this.mapUI.renderOverview({
    guess: result.guess,
    actual: result.actual
   });
  });

  /* ROUND COMMITTED */
  this.game.on("roundCommitted", () => {
   this.gameFlow.onRoundCommitted();
  });

  /* GAME END */
  this.game.on("gameEnded", () => {

   this.setScreen("result");

   const vm = this.vm.buildGameVM(this.game.state);

   this.staticUI.showGameResult(vm);
  });
 }
}
