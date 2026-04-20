export class Scoring {
 constructor({ geometry, difficulty }) {
  this.geometry = geometry;
  this.difficulty = difficulty;
 }

 calculateResult({ guess, actual, area }) {
  const distance = this.geometry.distance(guess, actual);

  const difficultyFactor = this.difficulty.get(area);

  const score = this.calculateScore(distance, difficultyFactor);

  return {
   distance,
   score
  };
 }

 calculateScore(distance, difficulty) {
  const base = Math.max(0, 5000 - distance * 10);
  return Math.round(base * difficulty);
 }
}
