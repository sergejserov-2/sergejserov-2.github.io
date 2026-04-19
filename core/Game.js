export class Game {
 constructor({ gameState, scoring }) {
  this.state = gameState;
  this.scoring = scoring;
  this.isLocked = false;
 }

 startGame() {
  this.state.start();
  this.state.status = "active";
 }

 startRound(location) {
  this.state.startRound(location);
  this.isLocked = false;
 }

 setGuess(playerId, point) {
  if (!this.state.currentRound || this.isLocked) return;

  this.state.setGuess(playerId, point);
 }

 finishGuess(playerId = "p1") {
  if (this.isLocked) return;

  const round = this.state.currentRound;
  if (!round) return;

  const guessObj = this.state.getGuess(playerId);
  if (!guessObj) return;

  const result = this.scoring.calculateResult({
   guess: guessObj.guess,
   actual: round.actualLocation
  });

  this.state.applyGuessResult(playerId, result);
  this.isLocked = true;
 }

 endGame() {
  this.state.endGame();
 }
}
