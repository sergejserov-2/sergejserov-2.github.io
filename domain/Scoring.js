export class Scoring {
 constructor({ difficulty }) {
  this.difficulty = difficulty;
 }

 calculate(actual, guess, context = {}) {
  if (!guess || !actual) {
   throw new Error("Scoring: invalid input");
  }

  const R = 6371; // Earth radius (km)

  const dLat = this.toRad(guess.lat - actual.lat);
  const dLng = this.toRad(guess.lng - actual.lng);

  const a =
   Math.sin(dLat / 2) * Math.sin(dLat / 2) +
   Math.cos(this.toRad(actual.lat)) *
   Math.cos(this.toRad(guess.lat)) *
   Math.sin(dLng / 2) *
   Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

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

 toRad(deg) {
  return (deg * Math.PI) / 180;
 }
}
