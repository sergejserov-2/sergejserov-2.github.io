import { Geometry } from "./math/Geometry.js";

export class Scoring {
 constructor({ difficulty }) {
  this.difficulty = difficulty;
 }

 calculate(actual, guess, context = {}) {
  if (!guess || !actual) {
   throw new Error("Scoring: invalid input");
  }

  const distance = Geometry.distance(actual, guess);

  const maxScore = 5000;
  const k = 0.002;

  const distanceScore =
   maxScore * Math.exp(-k * distance);

  const multiplier =
   this.difficulty?.getMultiplier?.(context.area) ?? 1;

  return {
   distance,
   score: Math.round(distanceScore * multiplier)
  };
 }
}
