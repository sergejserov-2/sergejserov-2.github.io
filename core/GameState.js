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

   // =========================
   // SOLO COMPATIBILITY
   // =========================
   guess: null,

   // =========================
   // DUEL MODE
   // =========================
   guesses: []
  });
 }

 getCurrentRound() {
  return this.rounds[this.rounds.length - 1];
 }

 // =========================
 // MULTI-GUESS READY
 // =========================
 setRoundResult(result) {
  const round = this.getCurrentRound();
  if (!round) return;

  const g = result.guess;

  if (!g || g.lat == null || g.lng == null) {
   console.warn("Invalid guess in GameState", result);
   return;
  }

  const payload = {
   playerId: result.playerId,
   lat: g.lat,
   lng: g.lng,
   distance: result.distance,
   score: result.score
  };

  // =========================
  // 🔥 DUEL STORAGE
  // =========================
  round.guesses.push(payload);

  // =========================
  // 🔥 SOLO COMPAT LAYER
  // (первый игрок = старый guess)
  // =========================
  if (!round.guess || result.playerId === "p1") {
   round.guess = payload;
  }
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

 reset() {
  this.status = "idle";
  this.rounds = [];
 }
}
