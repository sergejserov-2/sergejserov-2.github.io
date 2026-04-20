export class Difficulty {
 constructor() {}

 getMultiplier(area) {
  if (!area) return 1;

  const size = area.size ?? 1;
  const normalized = Math.min(Math.max(size, 0.1), 10);

  return 1 + (1 / normalized);
 }
}
