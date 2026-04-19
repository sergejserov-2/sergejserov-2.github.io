export class Bridge {
 constructor({ game, gameFlow, mapUI, streetViewUI, staticUI, viewModelBuilder }) {
  this.game = game;
  this.gameFlow = gameFlow;
  this.mapUI = mapUI;
  this.streetViewUI = streetViewUI;
  this.staticUI = staticUI;
  this.vm = viewModelBuilder;

  this.bind();
 }

 bind() {
  this.onRoundStart();

  this.mapUI.onGuess((point) => {
   this.game.setGuess("p1", point);

   const round = this.game.state.currentRound;
   const guess = round.guesses?.at(-1)?.guess;

   this.mapUI.placeGuessMarker(guess);
  });

  document.getElementById("makeGuess")?.addEventListener("click", () => {
   this.game.finishGuess("p1");

   const round = this.game.state.currentRound;

   this.staticUI.showRoundResult(
    this.vm.buildRoundVM(this.game.state, round)
   );

   this.mapUI.renderOverview({
    guess: round.guesses?.at(-1)?.guess,
    actual: round.actualLocation
   });
  });

  this.staticUI.playAgainButton?.addEventListener("click", () => {
   this.gameFlow.commitRound();
   this.onRoundStart();
  });

  this.game.endGame = () => {
   this.staticUI.showGameResult(
    this.vm.buildGameVM(this.game.state)
   );
  };
 }

 onRoundStart() {
  const round = this.game.state.currentRound;
  if (!round) return;

  this.staticUI.updateHUD(
   this.vm.buildHUD(this.game.state, round)
  );

  this.streetViewUI.setLocation(round.actualLocation);
  this.mapUI.reset();
 }
}
