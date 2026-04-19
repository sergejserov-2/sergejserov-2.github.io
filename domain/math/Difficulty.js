export class Difficulty {

 static fromArea(area) {
  if (!area) return 1;

  const min = area.minDistance ?? 1;

  // чем меньше minDistance → тем сложнее
  return Math.max(0.2, Math.log10(min + 1));
 }
}
