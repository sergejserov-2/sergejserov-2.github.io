export class Game {
 constructor({ gameState, scoring, players, config }) {
  this.gameState = gameState;
  this.scoring = scoring;
  this.players = players;
  this.config = config;
 }

 // =========================
 // GAME LIFECYCLE
 // =========================
 startGame() {
  this.gameState.startGame();
 }

 startRound(location) {
  this.gameState.startRound(location);
 }

 commitRound() {
  this.gameState.commitRound();
 }

 endGame() {
  this.gameState.endGame();
 }

 // =========================
 // GUESSES
 // =========================
 setGuess(playerId, point) {
  // всегда просто добавляем/перезаписываем через GameState
  this.gameState.setGuess(playerId, point);
 }

 finishGuess(playerId = "p1") {
  const round = this.gameState.getCurrentRound();
  if (!round) return;

  const guess = round.guesses.find(g => g.playerId === playerId);
  if (!guess || guess.isFinished) return;

  const result = this.scoring.calculate(
   round.actualLocation,
   guess.guess,
   { area: round.area }
  );

  this.gameState.finishGuess(playerId, result);

  return result;
 }

 // =========================
 // STATE ACCESS
 // =========================
 getState() {
  return this.gameState.getState();
 }

 getCurrentRound() {
  return this.gameState.getCurrentRound();
 }

 isGameEnded() {
  return this.gameState.getState().status === "ended";
 }
}
