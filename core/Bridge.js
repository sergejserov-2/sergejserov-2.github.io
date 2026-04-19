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

  this.bind();
 }

 bind() {

  /* GAME START */
  this.game.on("gameStarted", () => {
   this.staticUI.hideLoading();
  });

  /* ROUND START */
  this.game.on("roundStarted", ({ actual }) => {
   this.staticUI.updateHUD(
    this.vm.buildHUD(this.game.state, this.game.state.getCurrentRound())
   );

   this.streetViewUI.setLocation(actual);
   this.mapUI.reset();
  });

  /* GUESS UPDATE */
  this.game.on("guessUpdated", ({ guess }) => {
   this.mapUI.placeGuessMarker(guess);
  });

  /* GUESS FINISHED */
  this.game.on("guessFinished", ({ result }) => {

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

  /* ROUND COMMITTED → ONLY FLOW */
  this.game.on("roundCommitted", () => {
   this.gameFlow.commitRound();
  });

  /* GAME END */
  this.game.on("gameEnded", () => {

   const vm = this.vm.buildGameVM(this.game.state);

   this.staticUI.showGameResult(vm);
  });
 }
}
