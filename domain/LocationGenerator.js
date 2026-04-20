import { Geometry } from "./math/Geometry.js";

export class LocationGenerator {
 constructor({ mapAdapter }) {
  this.mapAdapter = mapAdapter;
 }

 async generate(area) {
  const polygon = area.polygon;

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts++ < maxAttempts) {
   const point =
    Geometry.getRandomPointInPolygon(polygon);

   try {
    const result =
     await this.mapAdapter.getStreetViewMeta(point);

    if (!result?.valid) continue;

    const verify =
     await this.mapAdapter.getStreetViewMeta(
      result.location
     );

    if (verify?.valid) {
     return result.location;
    }
   } catch (_) {}
  }

  throw new Error("LocationGenerator failed");
 }
}
