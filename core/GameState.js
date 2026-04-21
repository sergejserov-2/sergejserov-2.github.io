export class GameState {
 constructor() {
  this.status = "idle";
  this.rounds = [];
 }

 // =========================
 // GAME LIFECYCLE
 // =========================
 startGame() {
  this.status = "active";
  this.rounds = [];
 }

 endGame() {
  this.status = "ended";
 }

 
 // =========================
 // ROUND
 // =========================
 startRound(actualLocation) {
  this.rounds.push({
   index: this.rounds.length,
   actualLocation,
   guesses: []
  });
 }

 getCurrentRound() {
  return this.rounds[this.rounds.length - 1];
 }

 // =========================
 // GUESS
 // =========================
 setGuess(playerId, point) {
  const round = this.getCurrentRound();
  if (!round) return;

  round.guesses.push({
   playerId,
   guess: { lat: point.lat, lng: point.lng },
   distance: 0,
   score: 0,
   isFinished: false
  });
 }

 finishGuess(playerId, result) {
  const round = this.getCurrentRound();
  const guess = round?.guesses.find(g => g.playerId === playerId);

  if (!guess || guess.isFinished) return;

  guess.distance = result.distance;
  guess.score = result.score;
  guess.isFinished = true;

  return result;
 }

 // =========================
 // COMMIT
 // =========================
 commitRound() {
  // intentionally empty
  // rounds already persisted
 }

 // =========================
 // STATE
 // =========================
 getState() {
  return {
   status: this.status,
   rounds: this.rounds
  };
 }
}
