export class Game {
 constructor({ gameState, scoring }) {
  this.state = gameState;
  this.scoring = scoring;
  this.isLocked = false;
 }

 startGame() {
  this.state.start();
 }

 startRound(location) {
  this.state.startRound(location);
  this.isLocked = false;
 }

 setGuess(playerId, point) {
  const round = this.state.getCurrentRound();
  if (!round || this.isLocked) return;
  if (round.guesses.length > 0) {
   round.guesses[0].guess = point;
  } else {
   this.state.addGuess(playerId, point, { distance: 0, score: 0 });
  }
 }

 finishGuess(playerId = "p1") {
  const round = this.state.getCurrentRound();
  if (!round || this.isLocked) return;

  const guess = round.guesses?.[0];
  if (!guess) return;

  const result = this.scoring.calculateResult({
   guess: guess.guess,
   actual: round.actualLocation
  });

  guess.distance = result.distance;
  guess.score = result.score;

  this.isLocked = true;

  return result;
 }

 commitRound() {
  this.state.commitRound();
 }

 endGame() {
  this.state.end();
 }
}
