export class Area {
    constructor({ name, polygon }) {
        this.name = name;
        this.polygon = polygon;
    }
}

import Europe from "./regions/Europe.js";
import Asia from "./regions/Asia.js";
import Africa from "./regions/Africa.js";
import NorthAmerica from "./regions/NorthAmerica.js";
import LatinAmerica from "./regions/LatinAmerica.js";
import Oceania from "./regions/Oceania.js";
import MiddleEast from "./regions/MiddleEast.js";
import SovietUnion from "./regions/SovietUnion.js";

export const Areas = {
    europe: Europe,
    asia: Asia,
    africa: Africa,
    north_america: NorthAmerica,
    latin_america: LatinAmerica,
    oceania: Oceania,
    middleEast: MiddleEast,
    sovietUnion: SovietUnion,
};
