export class Game {
 constructor({ gameState, scoring, players = ["p1"] }) {
  this.state = gameState;
  this.scoring = scoring;
  this.players = players;
 }

 startGame() {
  this.state.start();
 }

 startRound(location) {
  this.state.startRound(location);
 }

 setGuess(playerId, point) {
  const round = this.state.getCurrentRound();
  if (!round) return;

  const existing = this.state.getPlayerGuess(playerId);

  if (existing) {
   existing.guess = point;
  } else {
   this.state.addGuess(playerId, point, {
    distance: 0,
    score: 0,
    isFinished: false
   });
  }
 }

 finishGuess(playerId = "p1") {
  const round = this.state.getCurrentRound();
  if (!round) return;

  const guess = this.state.getPlayerGuess(playerId);
  if (!guess || guess.isFinished) return;

  const result = this.scoring.calculateResult({
   guess: guess.guess,
   actual: round.actualLocation
  });

  guess.distance = result.distance;
  guess.score = result.score;
  guess.isFinished = true;

  return result;
 }

 areAllPlayersFinished() {
  const round = this.state.getCurrentRound();
  if (!round) return false;

  return this.players.every(playerId => {
   const g = this.state.getPlayerGuess(playerId);
   return g?.isFinished === true;
  });
 }

 commitRound() {
  this.state.commitRound();
 }

 endGame() {
  this.state.end();
 }
}
