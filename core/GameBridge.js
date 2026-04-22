export class GameBridge {
 constructor({ gameFlow, mode = "solo", network = null }) {
  this.gameFlow = gameFlow;
  this.mode = mode;
  this.network = network;

  this.listeners = {};
  this.bindGameFlow();
 }

 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================
 // GAMEFLOW → UI
 // =========================
 bindGameFlow() {
  const events = [
   "loadingStarted",
   "loadingFinished",
   "streetViewSetLocation",
   "roundStarted",
   "timerTick",
   "movesUpdated",
   "movesLocked",
   "inputLocked",
   "inputUnlocked",
   "roundResultShown",
   "gameEnded",
   "guessResolved"
  ];

  events.forEach(event => {
   this.gameFlow.on(event, (data) => {
    this.emit(event, data);
   });
  });
 }

 // =========================
 // UI → GAME
 // =========================
 startGame() {
  if (this.mode === "solo") {
   this.gameFlow.startGame();
  } else {
   this.network.send("startGame");
  }
 }

 finishGuess(point) {
  if (this.mode === "solo") {
   this.gameFlow.finishGuess(point);
  } else {
   this.network.send("finishGuess", point);
  }
 }

 nextRound() {
  if (this.mode === "solo") {
   this.gameFlow.nextRound();
  } else {
   this.network.send("nextRound");
  }
 }

 streetViewReady() {
  this.gameFlow.streetViewReady();
 }

 registerMove() {
  this.gameFlow.registerMove();
 }

 applyState(state) {
  this.gameFlow.applyState?.(state);
 }
}
