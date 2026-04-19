import { europe } from "../data/areas/Europe.js";
import { asia } from "../data/areas/Asia.js";
import { africa } from "../data/areas/Africa.js";
import { northAmerica } from "../data/areas/NorthAmerica.js";
import { latinAmerica } from "../data/areas/LatinAmerica.js";
import { oceania } from "../data/areas/Oceania.js";
import { middleEast } from "../data/areas/MiddleEast.js";
import { sovietUnion } from "../data/areas/SovietUnion.js";
import { moscow } from "../data/areas/Moscow.js";

const rawAreas = {
 europe, asia, africa, northAmerica, latinAmerica, oceania, middleEast, sovietUnion, moscow
};

function toRuntime(area) {
 return {
  name: area.name,
  minDistance: area.minDistance,
  polygon: area.polygon.map(([lat, lng]) => ({
   lat,
   lng
  }))
 };
}

export const AreaRegistry = {
 get(name) {
  const area = rawAreas[name];
  if (!area) {
   throw new Error(Area "${name}" not found);
  }
  return toRuntime(area);
 },
 list() {
  return Object.keys(rawAreas);
 }
};
