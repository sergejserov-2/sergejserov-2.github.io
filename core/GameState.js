export class GameState {
 constructor() {
  this.status = "idle";
  this.rounds = [];
 }

 // =========================
 // LIFECYCLE
 // =========================

 startGame() {
  this.status = "active";
  this.rounds = [];
 }

 startRound(actualLocation) {
  this.rounds.push({
   actualLocation,
   guess: null,
   guesses: []
  });
 }

 endGame() {
  this.status = "ended";
 }

 reset() {
  this.status = "idle";
  this.rounds = [];
 }

 // =========================
 // ACCESS
 // =========================

 getCurrentRound() {
  return this.rounds[this.rounds.length - 1];
 }

 getState() {
  return {
   status: this.status,
   rounds: this.rounds
  };
 }

 // =========================
 // 🔥 SERVER MUTATIONS ONLY
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

  // MULTI
  round.guesses.push(payload);

  // SOLO COMPAT
  if (!round.guess || result.playerId === "p1") {
   round.guess = payload;
  }
 }

 // =========================
 // 🔥 NEW: APPLY SNAPSHOT (для Firebase)
 // =========================

 apply(state) {
  if (!state) return;

  this.status = state.status ?? this.status;
  this.rounds = state.rounds ?? [];
 }
}
