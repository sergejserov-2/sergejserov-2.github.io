import { Emitter } from "./Emitter.js";

export class Game extends Emitter {
 constructor({ gameState, scoring }) {
  super();
  this.state = gameState;
  this.scoring = scoring;
  this.isLocked = false;
 }

 startGame() {
  this.state.start();
  this.fire("gameStarted");
 }

 startRound(location) {
  this.state.startRound(location);
  this.isLocked = false;

  this.fire("roundStarted", {
   round: this.state.currentRoundIndex,
   actual: location
  });
 }

 setGuess(playerId, point) {
  if (!this.state.getCurrentRound() || this.isLocked) return;

  this.state.setGuess(playerId, point);

  this.fire("guessUpdated", {
   playerId,
   guess: point
  });
 }

 finishGuess(playerId = "p1") {
  if (this.isLocked) return;

  const round = this.state.getCurrentRound();
  if (!round) return;

  const guess = this.state.getGuess(playerId);
  if (!guess) return;

  const result = this.scoring.calculateResult({
   guess: guess.guess,
   actual: round.actualLocation
  });

  this.state.applyGuessResult(playerId, result);

  this.isLocked = true;

  this.fire("guessFinished", {
   round: round.index,
   result,
   guess: guess.guess,
   actual: round.actualLocation
  });
 }

 endGame() {
  this.state.end();

  this.fire("gameEnded", {
   rounds: this.state.rounds
  });
 }
}
