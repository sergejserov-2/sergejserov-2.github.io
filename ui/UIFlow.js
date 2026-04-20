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

  this.bindState();
  this.bindGameEvents();
  this.connectInput();
 }

 bindState() {
  this.uiState.onChange(({ to }) => {
   this.staticUI.setScreen(to);
  });
 }

 setScreen(screen) {
  this.uiState.setScreen(screen);
 }

 connectInput() {
  this.mapUI.bindGuess((point) => {
   this.gameFlow.onGuess("p1", point);
  });

  const btn = document.getElementById("makeGuess");

  if (btn) {
   btn.addEventListener("click", () => {
    this.gameFlow.finishGuess("p1");
   });
  }
 }

 bindGameEvents() {

  // start
  this.gameFlow.on("gameStarted", () => {
   this.uiState.setScreen("round");
  });

  // round start
  this.gameFlow.on("roundStarted", ({ round, actual }) => {
   this.uiState.setScreen("round");

   const hud = this.uiBuilder.buildHUD(
    this.gameFlow.game.state,
    round
   );

   this.staticUI.updateHUD(hud);

   this.streetViewUI.setLocation(actual);
   this.mapUI.reset();
  });

  // guess marker update
  this.gameFlow.on("guessUpdated", ({ guess }) => {
   this.mapUI.placeGuessMarker(guess);
  });

  // result screen
  this.gameFlow.on("guessFinished", ({ result }) => {
   this.uiState.setScreen("result");

   const vm = this.uiBuilder.buildRoundVM(
    this.gameFlow.game.state,
    this.gameFlow.game.state.getCurrentRound()
   );

   this.staticUI.showRoundResult(vm);

   this.mapUI.renderOverview(
    this.gameFlow.game.state.getCurrentRound()
   );
  });

  // transition → next round
  this.gameFlow.on("roundCommitted", async () => {
   this.uiState.setScreen("transition");

   await new Promise(r => setTimeout(r, 1500));

   await this.gameFlow.nextRound();
  });

  // game end
  this.gameFlow.on("gameEnded", () => {
   this.uiState.setScreen("result");

   const vm = this.uiBuilder.buildGameVM(
    this.gameFlow.game.state
   );

   this.staticUI.showGameResult(vm);
  });
 }
}
