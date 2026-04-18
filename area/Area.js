export class Area {
    constructor({ name, polygon }) {
        this.name = name;
        this.polygon = polygon;
    }
}

import Europe from "./region/Europe.js";
import Asia from "./region/Asia.js";
import Africa from "./region/Africa.js";
import NorthAmerica from "./region/NorthAmerica.js";
import LatinAmerica from "./region/LatinAmerica.js";
import Oceania from "./region/Oceania.js";
import MiddleEast from "./region/MiddleEast.js";
import SovietUnion from "./region/SovietUnion.js";

export const AreaRegistry = {
    europe: Europe,
    asia: Asia,
    africa: Africa,
    north_america: NorthAmerica,
    latin_america: LatinAmerica,
    oceania: Oceania,
    middleEast: MiddleEast,
    sovietUnion: SovietUnion,
};
