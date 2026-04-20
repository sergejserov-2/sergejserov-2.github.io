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

  // =========================
  // ROUND START
  // =========================
  this.gameFlow.on("roundStarted", (vm) => {
    this.staticUI.stopRoundTimer();
    this.screenManager.show("round");

    this.mapWrapperUI.reset();
    this.mapOverviewUI.clear();

    this.staticUI.updateHUD(
      this.uiBuilder.formatGameVM(vm)
    );

    const loc = vm?.rounds?.[vm.currentRoundIndex]?.actualLocation;
    if (loc) this.streetViewUI?.setLocation(loc);
  });

  // =========================
  // ROUND END (RESULT DATA)
  // =========================
  this.gameFlow.on("roundEnded", (vm) => {
    const round = vm?.rounds?.[vm.currentRoundIndex];
    if (!round) return;

    this.mapOverviewUI.render(round);
  });

  // =========================
  // UX PHASE (PAUSE CONTROL)
  // =========================
  this.gameFlow.on("roundResultShown", ({ state }) => {

    this.screenManager.show("roundResult");

    this.staticUI.showRoundResult(
      this.uiBuilder.formatRoundVM(state)
    );

    // 🎬 UX PAUSE (единственное место задержки)
    setTimeout(() => {
      this.gameFlow.nextRound();
    }, 10000);
  });

  // =========================
  // GAME TIMER
  // =========================
  this.gameFlow.on("timerTick", (t) => {
    this.staticUI.updateTimer?.(t);
  });

  // =========================
  // MOVES
  // =========================
  this.gameFlow.on("movesUpdated", (m) => {
    this.staticUI.updateMoves?.(m);
  });

  // =========================
  // INPUT LOCK
  // =========================
  this.gameFlow.on("inputLocked", () => {
    this.staticUI.lockInput?.();
    this.mapWrapperUI.lock();
  });

  this.gameFlow.on("inputUnlocked", () => {
    this.staticUI.unlockInput?.();
    this.mapWrapperUI.unlock();
  });

  // =========================
  // GAME END
  // =========================
  this.gameFlow.on("gameEnded", (vm) => {
    this.screenManager.show("gameResult");

    this.staticUI.showGameResult(
      this.uiBuilder.formatGameResultVM(vm)
    );
  });
 }
}
