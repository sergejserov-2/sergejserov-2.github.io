export class Game {
 constructor({ gameState, scoring, players, config }) {
  this.gameState = gameState;
  this.scoring = scoring;
  this.players = players;
  this.config = config;
 }
 startGame() {
  this.state.start();
 }

 startRound(location) {
  this.state.startRound(location);
 }

 setGuess(playerId, point) {
  const existing = this.state.getPlayerGuess(playerId);

  if (existing) {
   this.state.updateGuess(playerId, point);
  } else {
   this.state.addGuess(playerId, {
    lat: point.lat,
    lng: point.lng
   });
  }
 }

 finishGuess(playerId = "p1") {
  const round = this.state.getCurrentRound();
  if (!round) return;

  const guess = this.state.getPlayerGuess(playerId);
  if (!guess || guess.isFinished) return;

  const result = this.scoring.calculate(
   round.actualLocation,
   guess.guess,
   { area: round.area }
  );

  this.state.finalizeGuess(playerId, result);

  return result;
 }

 commitRound() {
  this.state.commitRound();
 }

 endGame() {
  this.state.end();
 }

 getState() {
  return this.state.getState();
 }

 getCurrentRound() {
  return this.state.getCurrentRound();
 }

 isGameEnded() {
  return this.state.getState().status === "ended";
 }
}
