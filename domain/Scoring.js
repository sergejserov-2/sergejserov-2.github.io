import { Geometry } from "./math/Geometry.js";

export class Scoring {
 constructor({ difficulty }) {
  this.difficulty = difficulty;
 }

 calculate(actual, guess, context = {}) {
  if (!guess || !actual) {
   throw new Error("Scoring: invalid input");
  }

  // =========================
  // DISTANCE (STATIC GEOMETRY)
  // =========================
  const distance = Geometry.distance(guess, actual);

  // =========================
  // DISTANCE SCORE CURVE
  // =========================
  const distanceScore = this.getDistanceScore(distance);

  // =========================
  // DIFFICULTY FACTOR (AREA-BASED)
  // =========================
  const difficultyFactor =
   this.difficulty?.getMultiplier?.(context.area) ?? 1;

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
}
