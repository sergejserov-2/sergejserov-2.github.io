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
    const result = await this.mapAdapter.getStreetViewMeta(point);

    if (result?.valid && result?.location) {
     return result.location;
    }

   } catch (e) {
    console.warn("StreetView meta error:", e);
   }
  }

  throw new Error("LocationGenerator: failed to find valid location");
 }
}
