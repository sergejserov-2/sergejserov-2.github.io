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

  const g = result.guess;

  if (!g  g.lat == null  g.lng == null) {
   console.warn("Invalid guess in GameState", result);
   return;
  }

  // ✅ ПЛОСКАЯ СТРУКТУРА
  round.guess = {
   playerId: result.playerId,
   lat: g.lat,
   lng: g.lng,
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
