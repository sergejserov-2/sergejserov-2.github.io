export class GameFlow {
 constructor({ game, generator, scoring }) {
  this.game = game;
  this.generator = generator;
  this.scoring = scoring;

  this.listeners = {};

  // runtime context (inject from init)
  this.area = null;
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
  const round = this.game.state.getCurrentRound();
  if (!round) return;

  const guess = this.game.state.getPlayerGuess(playerId);
  if (!guess || guess.isFinished) return;

  const result = this.scoring.calculateResult({
   guess: guess.guess,
   actual: round.actualLocation,
   area: this.area
  });

  guess.distance = result.distance;
  guess.score = result.score;
  guess.isFinished = true;

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

  if (this.game.state.getState().status === "ended") {
   this.emit("gameEnded");
  }
 }

 async startNextRoundWithDelay(ms = 1200) {
  await new Promise(r => setTimeout(r, ms));
  await this.nextRound();
 }
}
