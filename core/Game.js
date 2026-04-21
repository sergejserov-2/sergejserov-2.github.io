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

 endGame() {
  this.gameState.endGame();
 }

 // =========================
 // CORE ACTION
 // =========================
 setGuess(playerId, point) {
  const round = this.gameState.getCurrentRound();
  if (!round) return null;

  // 🔥 ВАЖНО: нормализация входа (частый источник 0/0)
  const guess = {
   lat: point?.lat,
   lng: point?.lng
  };

  const actual = round.actualLocation;

  if (!actual || guess.lat == null || guess.lng == null) {
   console.warn("Invalid scoring input", { actual, guess });
   return null;
  }

  const result = this.scoring.calculate(actual, guess);

  // 🔥 ЕДИНСТВЕННАЯ запись результата
  this.gameState.setRoundResult({
   playerId,
   guess,
   distance: result.distance,
   score: result.score
  });

  return result;
 }

 // =========================
 // ACCESS
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
