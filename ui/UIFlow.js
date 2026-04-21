export class UIFlow {
 constructor({
  gameFlow,
  screenManager,
  staticUI,
  uiBuilder,
  streetViewUI,
  mapWrapperUI,
  roundOverviewUI,
  gameOverviewUI
 }) {
  this.gameFlow = gameFlow;
  this.screenManager = screenManager;
  this.staticUI = staticUI;
  this.uiBuilder = uiBuilder;
  this.streetViewUI = streetViewUI;
  this.mapWrapperUI = mapWrapperUI;
  this.roundOverviewUI = roundOverviewUI;
  this.gameOverviewUI = gameOverviewUI;

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

  this.gameFlow.on("streetViewSetLocation", (loc) => {
   this.streetViewUI.setLocation(loc);
  });

  this.gameFlow.on("roundStarted", (vm) => {
   this.mapWrapperUI.reset();
   this.mapOverviewUI.clear();

   this.staticUI.stopRoundTimer?.();

   this.staticUI.updateHUD(
    this.uiBuilder.formatGameVM(vm)
   );
  });

  this.gameFlow.on("timerTick", t => this.staticUI.updateTimer(t));
  this.gameFlow.on("movesUpdated", m => this.staticUI.updateMoves(m));

  this.gameFlow.on("inputLocked", () => {
   this.staticUI.lockInput?.();
   this.mapWrapperUI.lock();
  });

  this.gameFlow.on("inputUnlocked", () => {
   this.staticUI.unlockInput?.();
   this.mapWrapperUI.unlock();
  });

  // =========================
  // ROUND RESULT
  // =========================
  this.gameFlow.on("roundResultShown", ({ state }) => {

   const round = state.rounds?.[state.rounds.length - 1];
   if (!round) return;

   this.roundOverviewUI.render(round);

   this.screenManager.show("roundResult");

   this.staticUI.showRoundResult(
    this.uiBuilder.formatRoundVM(state)
   );

   const duration = 7500;

   requestAnimationFrame(() => {
    this.roundOverviewUI.forceResize();
   });

   this.staticUI.startRoundDelay(duration, () => {
    this.gameFlow.nextRound();
   });
  });

  // =========================
  // GAME END
  // =========================
          this.gameFlow.on("gameEnded", (vm) => {
           
            const rounds = vm.rounds || [];
            const last = rounds[rounds.length - 1];
            if (!last) return;

            this.gameOverviewUI.render(last);
            this.screenManager.show("gameResult");
           
            this.staticUI.showGameResult(
              this.uiBuilder.formatGameResultVM(vm)
            );
                    
            requestAnimationFrame(() => {
                this.gameOverviewUI.forceResize();          
            });
          });
 }
}
