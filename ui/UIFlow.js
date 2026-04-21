export class UIFlow {
 constructor({
  gameFlow,
  screenManager,
  staticUI,
  uiBuilder,
  streetViewUI,
  mapWrapperUI,
  mapOverviewUI
 }) {
  this.gameFlow = gameFlow;
  this.screenManager = screenManager;
  this.staticUI = staticUI;
  this.uiBuilder = uiBuilder;
  this.streetViewUI = streetViewUI;
  this.mapWrapperUI = mapWrapperUI;
  this.mapOverviewUI = mapOverviewUI;

  this.bind();
 }

 bind() {

  this.streetViewUI.onReady = () => {
   this.gameFlow.streetViewReady();
  };

  this.gameFlow.on("loadingStarted", () => {
   this.screenManager.show("loading");
  });

  this.gameFlow.on("loadingFinished", () => {
   this.screenManager.show("round");
  });

  this.gameFlow.on("streetViewSetLocation", (location) => {
   this.streetViewUI.setLocation(location);
  });

  this.gameFlow.on("roundStarted", (vm) => {
   this.mapWrapperUI.reset();
   this.mapOverviewUI.clear();

   this.staticUI.stopRoundTimer?.();

   this.staticUI.updateHUD(
    this.uiBuilder.formatGameVM(vm)
   );
  });

  this.gameFlow.on("timerTick", (t) => {
   this.staticUI.updateTimer(t);
  });

  this.gameFlow.on("movesUpdated", (m) => {
   this.staticUI.updateMoves?.(m);
  });

  this.gameFlow.on("inputLocked", () => {
   this.staticUI.lockInput?.();
   this.mapWrapperUI.lock();
  });

  this.gameFlow.on("inputUnlocked", () => {
   this.staticUI.unlockInput?.();
   this.mapWrapperUI.unlock();
  });

  this.gameFlow.on("roundResultShown", ({ state }) => {

   const rounds = state.rounds || [];
   const round = rounds[rounds.length - 1];
   if (!round) return;

   this.mapOverviewUI.render(round);

   const vm = this.uiBuilder.formatRoundVM(state);

   this.screenManager.show("roundResult");
   this.staticUI.showRoundResult(vm);

   const duration = 7500;

   // 🔥 сначала layout + resize
   requestAnimationFrame(() => {
    this.mapOverviewUI.forceResize?.();
   });

   // 🔥 старт таймера ПОСЛЕ показа UI
   setTimeout(() => {
    this.staticUI.startRoundTimer(duration, () => {
     this.gameFlow.nextRound();
    });
   }, 50);
  });

  this.gameFlow.on("gameEnded", (vm) => {
   this.screenManager.show("gameResult");

   this.staticUI.showGameResult(
    this.uiBuilder.formatGameResultVM(vm)
   );
  });
 }
}
