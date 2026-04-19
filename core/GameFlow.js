export class GameFlow {
 constructor({ game, generator, scoring, area }) {
  this.game = game;
  this.generator = generator;
  this.scoring = scoring;
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
  this.emit("gameStarted");
  await this.nextRound();
 }

 async nextRound() {
  const location = await this.generator.generate(this.area);

  this.game.startRound(location);

  this.emit("roundStarted", {
   round: this.game.state.getCurrentRound(),
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

  this.emit("guessFinished", {
   result,
   round: this.game.state.getCurrentRound()
  });

  if (this.game.areAllPlayersFinished()) {
   this.commitRound();
  }
 }

 commitRound() {
  this.game.commitRound();

  this.emit("roundCommitted");

  if (this.game.state.getState().status === "ended") {
   this.emit("gameEnded");
  }
 }

 async startNextRoundWithDelay(ms = 1200) {
  await new Promise(r => setTimeout(r, ms));
  await this.nextRound();
 }
}
