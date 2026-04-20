export class Difficulty {
 get(area) {
  if (!area || !area.polygon) {
   throw new Error("Difficulty: invalid area");
  }

  const base = area.minDistance || 1;

  // чем меньше minDistance → тем сложнее угадывать
  const factor = 1000 / base;

  return Math.min(2, Math.max(0.3, factor));
 }
}
