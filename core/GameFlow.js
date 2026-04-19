export class GameFlow {
 constructor({ game, generator, area }) {
  this.game = game;
  this.generator = generator;
  this.area = area;

  this.roundsLeft = 10;
 }

 async startGame() {
  this.game.startGame();
  await this.nextRound();
 }

 async nextRound() {
  if (this.roundsLeft <= 0) {
   this.game.endGame();
   return;
  }

  this.roundsLeft--;

  const location = await this.generator.generate(this.area);

  this.game.startRound(location);
 }

 commitRound() {
  this.nextRound();
 }
}
