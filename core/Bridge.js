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
  this.game.startGame?.();

  /* ROUND START */
  this.game.startRound = (location) => {
   this.game.state.startRound(location);

   const round = this.game.state.getCurrentRound();
   if (!round) return;

   this.staticUI.updateHUD(
    this.vm.buildHUD(this.game.state, round)
   );

   this.streetViewUI.setLocation(round.actualLocation);
   this.mapUI.reset();
  };

  /* GUESS */
  this.mapUI.onGuess((point) => {
   const round = this.game.state.getCurrentRound();
   if (!round) return;

   this.game.setGuess("p1", point);

   const updatedRound = this.game.state.getCurrentRound();
   const guess = updatedRound.guesses?.[0]?.guess;

   this.mapUI.placeGuessMarker(guess);
  });

  /* ROUND FINISH */
  this.game.finishGuess = () => {
   const round = this.game.state.getCurrentRound();
   if (!round) return;

   const guess = round.guesses?.[0];
   if (!guess) return;

   const result = this.game.scoring.calculateResult({
    guess: guess.guess,
    actual: round.actualLocation
   });

   this.game.state.addGuess("p1", guess.guess, result);

   const vm = this.vm.buildRoundVM(this.game.state, round);

   this.staticUI.showRoundResult(vm);

   this.mapUI.renderOverview({
    guess: guess.guess,
    actual: round.actualLocation
   });
  };

  /* ROUND COMMIT */
  this.game.commitRound = () => {
   this.game.state.commitRound();
   this.gameFlow.onRoundCommitted();
  };

  /* GAME END */
  this.game.endGame = () => {
   this.game.state.end();

   const vm = this.vm.buildGameVM(this.game.state);

   this.staticUI.showGameResult(vm);
  };
 }

 sync() {
  const round = this.game.state.getCurrentRound();
  if (!round) return;

  this.staticUI.updateHUD(
   this.vm.buildHUD(this.game.state, round)
  );

  this.streetViewUI.setLocation(round.actualLocation);
  this.mapUI.reset();
 }
}
