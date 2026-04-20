export class UIFlow {
 constructor({
  gameFlow,
  mapUI,
  streetViewUI,
  staticUI,
  screenManager,
  uiState,
  uiBuilder
 }) {
  this.gameFlow = gameFlow;
  this.mapUI = mapUI;
  this.streetViewUI = streetViewUI;
  this.staticUI = staticUI;
  this.screenManager = screenManager;
  this.uiState = uiState;
  this.uiBuilder = uiBuilder;

  this.bind();
 }

 bind() {

  // =========================
  // GAME START
  // =========================
  this.gameFlow.on("gameStarted", (vm) => {
   this.screenManager.setScreen("round");

   if (vm) {
    this.staticUI.updateHUD(
     this.uiBuilder.formatHUD(vm)
    );
   }
  });

  // =========================
  // ROUND UPDATE (HUD sync)
  // =========================
  this.gameFlow.on("stateUpdated", (vm) => {
   this.staticUI.updateHUD(
    this.uiBuilder.formatHUD(vm)
   );
  });

  // =========================
  // ROUND END
  // =========================
  this.gameFlow.on("roundEnded", (vm) => {

   // 1. переключаем экран результата
   this.screenManager.setScreen("result");

   // 2. строим UI model
   const model = this.uiBuilder.formatRoundResult(vm);

   // 3. рендерим
   this.staticUI.showRoundResult(model);
  });

  // =========================
  // NEXT ROUND START
  // =========================
  this.gameFlow.on("nextRound", () => {
   this.screenManager.setScreen("round");
  });

  // =========================
  // GAME END
  // =========================
  this.gameFlow.on("gameEnded", (vm) => {

   // 1. экран итогов
   this.screenManager.setScreen("gameover");

   // 2. UI model
   const model = this.uiBuilder.formatGameResult(vm);

   // 3. рендер
   this.staticUI.showGameResult(model);
  });
 }

 // =========================
 // USER INPUT (MAP GUESS)
 // =========================
 onGuess(point) {
  this.gameFlow.finishGuess(point);
 }
}
