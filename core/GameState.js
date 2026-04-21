export class GameState {
 constructor() {
  this.status = "idle";
  this.rounds = [];
 }

 start() {
  this.status = "active";
  this.rounds = [];
 }

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

 setGuess(playerId, point) {
  const round = this.getCurrentRound();
  if (!round) return;

  const guess = {
   playerId,
   guess: { lat: point.lat, lng: point.lng },
   distance: 0,
   score: 0,
   isFinished: false
  };

  round.guesses.push(guess);
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

 commitRound() {
  // теперь только фиксация (без индексов)
 }

 endGame() {
  this.status = "ended";
 }

 getState() {
  return {
   status: this.status,
   rounds: this.rounds
  };
 }
}
