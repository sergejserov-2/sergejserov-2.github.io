export class GameState {
 constructor() {
  this.status = "idle";
  this.rounds = [];
 }

 startGame() {
  this.status = "active";
  this.rounds = [];
 }

 startRound(actualLocation) {
  this.rounds.push({
   actualLocation,
   guess: null
  });
 }

 getCurrentRound() {
  return this.rounds[this.rounds.length - 1];
 }

 setRoundResult(result) {
  const round = this.getCurrentRound();
  if (!round) return;

  round.guess = {
   playerId: result.playerId,
   guess: result.guess,
   distance: result.distance,
   score: result.score
  };
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
