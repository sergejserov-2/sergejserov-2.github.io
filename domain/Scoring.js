export class Scoring {
 constructor({ geometry, difficulty }) {
  this.geometry = geometry;
  this.difficulty = difficulty;

  this.MAX_SCORE = 5000;
  this.DISTANCE_K = 2000;
 }

 calculateResult({ guess, actual, area }) {

  const distance = this.geometry.distance(guess, actual);

  // =========================
  // DISTANCE CURVE (EXP decay)
  // =========================
  const distanceFactor = Math.exp(-distance / this.DISTANCE_K);

  // =========================
  // DIFFICULTY CURVE
  // =========================
  const difficultyFactor = this.getDifficultyFactor(area);

  // =========================
  // FINAL SCORE
  // =========================
  const score = Math.round(
   this.MAX_SCORE * distanceFactor * difficultyFactor
  );

  return {
   distance,
   score
  };
 }

 getDifficultyFactor(area) {
  const d = this.difficulty.get(area);

  // нормализация (балансировка)
  return this.clamp(d, 0.5, 2.0);
 }

 clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
 }
}
