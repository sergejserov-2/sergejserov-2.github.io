export class Game {
 constructor({ gameState, scoring, players, config }) {
  this.gameState = gameState;
  this.scoring = scoring;
  this.players = players;
  this.config = config;
 }

 startGame() {
  this.gameState.startGame();
 }

 startRound(location) {
  this.gameState.startRound(location);
 }

 setGuess(playerId, point) {
  const round = this.gameState.getCurrentRound();
  if (!round) return;

  const result = this.scoring.calculate(
   round.actualLocation,
   {
    lat: point.lat,
    lng: point.lng
   },
   { area: round.area }
  );

  this.gameState.setRoundResult({
   playerId,
   guess: point,
   distance: result.distance,
   score: result.score
  });

  return result;
 }

 finishGuess() {
  // теперь ничего не ищем, всё уже записано
 }

 commitRound() {
  // больше не нужен (оставляем пустым для совместимости)
 }

 endGame() {
  this.gameState.endGame();
 }

 getState() {
  return this.gameState.getState();
 }

 isGameEnded() {
  return this.gameState.getState().status === "ended";
 }
}
