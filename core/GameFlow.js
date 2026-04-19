export class GameFlow {
 constructor({ game, generator, area }) {
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.listeners = {};
 }

 // ===== events =====
 on(event, fn) {
  (this.listeners[event] ||= []).push(fn);
 }

 emit(event, payload) {
  (this.listeners[event] || []).forEach(fn => fn(payload));
 }

 // ===== lifecycle =====
 async startGame() {
  this.game.startGame();
  this.emit("gameStarted");
  await this.nextRound();
 }

 async nextRound() {
  const location = await this.generator.generate(this.area);

  this.game.startRound(location);

  const round = this.game.state.getCurrentRound();

  this.emit("roundStarted", {
   round,
   actual: location
  });
 }

 onGuess(playerId, point) {
  this.game.setGuess(playerId, point);

  this.emit("guessUpdated", {
   playerId,
   guess: point
  });
 }

 finishGuess(playerId = "p1") {
  const result = this.game.finishGuess(playerId);

  if (!result) return;

  const round = this.game.state.getCurrentRound();

  this.emit("guessFinished", {
   result,
   round
  });

  if (this.game.areAllPlayersFinished()) {
   this.commitRound();
  }
 }

 commitRound() {
  this.game.commitRound();

  this.emit("roundCommitted");

  if (this.isGameFinished()) {
   this.endGame();
  } else {
   this.nextRound();
  }
 }

 endGame() {
  this.game.endGame();
  this.emit("gameEnded");
 }

 isGameFinished() {
  const state = this.game.state.getState();
  return state.status === "ended";
 }
}
