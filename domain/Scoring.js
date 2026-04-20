export class Scoring {
 constructor({ geometry, difficulty }) {
  this.geometry = geometry;
  this.difficulty = difficulty;
 }

 calculateResult({ guess, actual }) {
  if (!guess || !actual) {
   throw new Error("Scoring: invalid input");
  }

  // =========================
  // DISTANCE
  // =========================
  const distance = this.geometry.distance(guess, actual);

  // =========================
  // DISTANCE SCORE CURVE
  // =========================
  const distanceScore = this.getDistanceScore(distance);

  // =========================
  // DIFFICULTY FACTOR
  // =========================
  const difficultyFactor = this.getDifficultyFactor(distance);

  // =========================
  // FINAL SCORE
  // =========================
  const score = Math.round(distanceScore * difficultyFactor);

  return {
   distance,
   score
  };
 }

 // =========================
 // DISTANCE CURVE
 // =========================
 getDistanceScore(distance) {
  const maxScore = 5000;

  // экспоненциальное затухание
  const k = 0.002;

  return maxScore * Math.exp(-k * distance);
 }

 // =========================
 // DIFFICULTY CURVE
 // =========================
 getDifficultyFactor(distance) {
  return this.difficulty.get(distance);
 }
}
