import { Geometry } from "./math/Geometry.js";
import { Difficulty } from "./math/Difficulty.js";

export class Scoring {

 constructor({ maxScore = 5000, k = 500 } = {}) {
  this.maxScore = maxScore;
  this.k = k;
 }

 calculateResult({ guess, actual, area }) {

  const distance = Geometry.distance(guess, actual);

  const difficulty = Difficulty.fromArea(area);

  const score = this.calculateScore(distance, difficulty);

  return {
   distance,
   score
  };
 }

 calculateScore(distance, difficulty = 1) {
  const normalizedDifficulty = Math.max(0.2, difficulty);

  const score =
   this.maxScore *
   Math.exp(-distance / (this.k * normalizedDifficulty));

  return Math.round(Math.max(0, score));
 }
}
