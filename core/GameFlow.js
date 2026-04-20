export class GameFlow {
 constructor({ game, generator, area }) {
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.listeners = {};
 }

 on(event, fn) {
  (this.listeners[event] ||= []).push(fn);
 }

 emit(event, payload) {
  (this.listeners[event] || []).forEach(fn => fn(payload));
 }

 async startGame() {
  this.game.startGame();

  this.emit("gameStarted", this.buildGameVM());

  await this.nextRound();
 }

 async nextRound() {
  const location = await this.generator.generate(this.area);

  this.game.startRound(location);

  this.emit("roundStarted", this.buildRoundVM(location));
 }

 onGuess(playerId, point) {
  this.game.setGuess(playerId, point);

  this.emit("guessUpdated", {
   playerId,
   point
  });
 }

 finishGuess(playerId = "p1") {
  const result = this.game.finishGuess(playerId);
  if (!result) return;

  this.emit("guessFinished", this.buildResultVM(result));

  this._handleRoundEndWithDelay();
 }

 _handleRoundEndWithDelay() {
  this.emit("roundEndStarted");

  setTimeout(() => {
   this.emit("roundEndFinished");

   this.game.commitRound();

   if (this.game.isGameEnded()) {
    this.emit("gameEnded", this.buildGameVM());
   } else {
    this.nextRound();
   }
  }, 3000);
 }

 // =====================
 // 🔥 VM CONTRACT LAYER
 // =====================

 buildRoundVM(actualLocation = null) {
  const round = this.game.getCurrentRound();
  const state = this.game.getState();

  return {
   type: "ROUND_VM",
   index: round?.index ?? 0,
   totalRounds: state.rounds.length + 1,
   actualLocation,

   // 🔥 PROGRESS (раундовый)
   progress: (round?.index ?? 0) / Math.max(state.rounds.length + 1, 1)
  };
 }

 buildResultVM(result) {
  const round = this.game.getCurrentRound();

  return {
   type: "RESULT_VM",
   distance: result.distance,
   score: result.score,
   roundIndex: round?.index ?? 0
  };
 }

 buildGameVM() {
  const state = this.game.getState();

  return {
   type: "GAME_VM",
   status: state.status,
   totalRounds: state.rounds.length,

   // 🔥 PROGRESS (игровой)
   progress: state.rounds.length > 0
    ? state.currentRoundIndex / Math.max(state.rounds.length, 1)
    : 0
  };
 }
}
