export class Game {
 constructor({ gameState, players = ["p1"] }) {
  this.state = gameState;
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
   this.state.addGuess(playerId, point);
  }
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
