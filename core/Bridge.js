export class Bridge {
 constructor({ game, mapUI, streetViewUI, staticUI, viewModelBuilder }) {
  this.game = game;
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
  this.game.on("roundStarted", () => {

   this.staticUI.updateHUD(
    this.vm.buildHUD(this.game.state, this.game.state.currentRound)
   );

   const location = this.game.state.currentRound.actualLocation;

   this.streetViewUI.onReady(() => {
    this.streetViewUI.setLocation(location);
   });

   this.mapUI.resetGuess();
  });

  /* GUESS UPDATE */
  this.game.on("guessUpdated", ({ guess }) => {
   this.mapUI.placeGuessMarker(guess);
  });

  /* GUESS FINISHED */
  this.game.on("guessFinished", ({ result }) => {

   const vm = this.vm.buildRoundVM(
    this.game.state,
    this.game.state.currentRound
   );

   this.staticUI.showRoundResult(vm);

   this.mapUI.renderOverview({
    guess: result.guess,
    actual: result.actual
   });
  });

  /* ROUND COMMIT */
  this.game.on("roundCommitted", () => {
   this.game.startRound(this.game.state.area);
  });

  /* GAME END */
  this.game.on("gameEnded", () => {

   const vm = this.vm.buildGameVM(this.game.state);

   this.staticUI.showGameResult(vm);
  });
 }
}
