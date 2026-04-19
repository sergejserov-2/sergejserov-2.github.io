import { Geometry } from "./math/Geometry.js";

export class LocationGenerator {
 constructor({ mapAdapter }) {
  this.mapAdapter = mapAdapter;
 }

 async generate(area) {
  const polygon = area.polygon;

  while (true) {
   const point = Geometry.getRandomPointInPolygon(polygon);

   const { valid, location } =
    await this.mapAdapter.getStreetViewMeta(point);

   if (valid && location) {
    return location;
   }
  }
 }
}
