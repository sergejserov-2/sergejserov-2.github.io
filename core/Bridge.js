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

  // ===== выбор точки =====
  this.mapUI.onGuess((point) => {
   const round = this.game.state.getCurrentRound();
   if (!round) return;

   this.game.setGuess("p1", point);

   const guess = round.guesses?.[0]?.guess;
   if (guess) this.mapUI.placeGuessMarker(guess);
  });

  // ===== кнопка "Сделать выбор" =====
  const guessBtn = document.getElementById("makeGuess");

  guessBtn?.addEventListener("click", () => {
   const round = this.game.state.getCurrentRound();
   if (!round) return;

   const result = this.game.finishGuess("p1");
   if (!result) return;

   const vm = this.vm.buildRoundVM(this.game.state, round);

   this.staticUI.showRoundResult(vm);

   this.mapUI.renderOverview({
    guess: round.guesses?.[0]?.guess,
    actual: round.actualLocation
   });
  });

  // ===== переход к следующему раунду =====
  this.staticUI.element
   ?.querySelector(".guess-overview")
   ?.addEventListener("click", () => {
    this.staticUI.hideResult();
    this.game.commitRound();
    this.gameFlow.onRoundCommitted();
   });
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
