import { Geometry } from "./math/Geometry.js";

export class LocationGenerator {
 constructor({ mapAdapter }) {
  this.mapAdapter = mapAdapter;
 }

 async generate(area) {
  const polygon = area.polygon;

  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
   attempts++;

   const point = Geometry.getRandomPointInPolygon(polygon);

   try {
    const { valid, location } =
     await this.mapAdapter.getStreetViewMeta(point);

    if (valid && location) {
     return location;
    }
   } catch (e) {
    console.warn("StreetView meta error:", e);
   }
  }

  throw new Error("LocationGenerator: failed to find valid location");
 }
}
