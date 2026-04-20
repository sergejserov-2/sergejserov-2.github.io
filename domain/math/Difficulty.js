export class Difficulty {
 constructor() {}

 getMultiplier(area) {
  if (!area) {
   return 1;
  }

  // базовая логика:
  // чем больше регион — тем проще (меньше множитель)
  // чем меньше регион — тем сложнее (больше множитель)

  const size = area.size ?? 1;

  // нормализация (примерная)
  const normalized = Math.min(Math.max(size, 0.1), 10);

  // инверсия (маленький регион → больше множитель)
  const multiplier = 1 + (1 / normalized);

  return multiplier;
 }
}
