export class GameState {
 constructor() {
  this.status = "idle";
  this.currentRoundIndex = 0;
  this.rounds = [];
 }

 start() {
  this.status = "active";
  this.rounds = [];
  this.currentRoundIndex = 0;
 }

 startRound(actualLocation) {
  this.rounds.push({
   index: this.currentRoundIndex,
   actualLocation: {
    lat: actualLocation.lat,
    lng: actualLocation.lng
   },
   guesses: []
  });
 }

 getCurrentRound() {
  return this.rounds[this.currentRoundIndex];
 }

 getPlayerGuess(playerId) {
  const round = this.getCurrentRound();
  return round?.guesses.find(g => g.playerId === playerId);
 }

 addGuess(playerId, guess, result) {
  const round = this.getCurrentRound();
  if (!round) return;

  round.guesses.push({
   playerId,
   guess: {
    lat: guess.lat,
    lng: guess.lng
   },
   distance: result.distance,
   score: result.score
  });
 }

 commitRound() {
  this.currentRoundIndex++;
 }

 end() {
  this.status = "ended";
 }

 getState() {
  return {
   status: this.status,
   currentRoundIndex: this.currentRoundIndex,
   rounds: this.rounds
  };
 }
}
