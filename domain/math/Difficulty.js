export class Difficulty {
 constructor({ area }) {
  this.area = area;
 }

 get(area) {

  // базовая идея:
  // чем меньше зона — тем сложнее

  const size = area.polygon.length;

  // инверсия размера
  const raw = 100 / size;

  return raw;
 }
}
