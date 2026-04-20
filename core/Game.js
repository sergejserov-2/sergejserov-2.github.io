export class Game {
 constructor({ gameState, scoring, players = ["p1"] }) {
  this.state = gameState;
  this.scoring = scoring;
  this.players = players;
 }

 startGame() {
  this.state.start();
 }

 startRound(location) {
  this.state.startRound(location);
 }

 setGuess(playerId, point) {
  const existing = this.state.getPlayerGuess(playerId);

  if (existing) {
   // через addGuess запрещено — поэтому обновляем через API GameState
   this.state.updateGuess(playerId, point);
  } else {
   this.state.addGuess(playerId, point, {
    distance: 0,
    score: 0,
    isFinished: false
   });
  }
 }

 finishGuess(playerId = "p1") {
  const round = this.state.getCurrentRound();
  if (!round) return;

  const guess = this.state.getPlayerGuess(playerId);
  if (!guess || guess.isFinished) return;

  const result = this.scoring.calculate(
   round
