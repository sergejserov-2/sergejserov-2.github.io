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

  // выбор точки
  this.mapUI.onGuess((point) => {
   const round = this.game.state.getCurrentRound();
   if (!round) return;

   this.game.setGuess("p1", point);

   const guess = this.game.state.getPlayerGuess("p1");
   if (guess) this.mapUI.placeGuessMarker(guess.guess);
  });

  // кнопка "угадать"
  const guessBtn = document.getElementById("makeGuess");

  guessBtn?.addEventListener("click", () => {
   const round = this.game.state.getCurrentRound();
   if (!round) return;

   const result = this.game.finishGuess("p1");
   if (!result) return;

   // ждём остальных игроков
   if (!this.game.areAllPlayersFinished()) return;

   const vm = this.vm.buildRoundVM(this.game.state, round);

   this.staticUI.showRoundResult(vm);

   this.mapUI.renderOverview({
    guess: this.game.state.getPlayerGuess("p1")?.guess,
    actual: round.actualLocation
   });
  });

  // следующий раунд
  this.staticUI
