export class Difficulty {
 constructor({ area }) {
  if (!area || !area.polygon) {
   throw new Error("Difficulty: invalid area");
  }

  this.area = area;
 }

 get(distance) {
  // 🔹 нормализация дистанции
  const maxDistance = 20000; // км (пример: половина Земли)
  const normalized = Math.min(distance / maxDistance, 1);

  // 🔹 кривая сложности (можно потом усложнить)
  const factor = 1 - normalized;

  return factor;
 }
}
