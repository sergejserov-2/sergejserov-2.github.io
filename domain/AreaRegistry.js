import { europe } from "./area/regions/Europe.js";
import { asia } from "./area/regions/Asia.js";
import { africa } from "./area/regions/Africa.js";
import { northAmerica } from "./area/regions/NorthAmerica.js";
import { latinAmerica } from "./area/regions/LatinAmerica.js";
import { oceania } from "./area/regions/Oceania.js";
import { middleEast } from "./area/regions/MiddleEast.js";
import { sovietUnion } from "./area/regions/SovietUnion.js";
import { moscow } from "./area/test/Moscow.js";

const rawAreas = {
    europe, asia, africa, northAmerica, latinAmerica, oceania, middleEast, sovietUnion,
    moscow
};

/**
 * Convert [lat, lng] → { lat, lng }
 */
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

/**
 * PUBLIC API
 */
export const AreaRegistry = {
 get(name) {
  const area = rawAreas[name];

  if (!area) {
   throw new Error(`Area "${name}" not found`);
  }

  return toRuntime(area);
 },

 list() {
  return Object.keys(rawAreas);
 }
};
