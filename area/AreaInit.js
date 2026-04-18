import Europe from "./regions/Europe.js";

// заглушки под остальные регионы
import Asia from "./regions/Asia.js";
import Africa from "./regions/Africa.js";
import NorthAmerica from "./regions/NorthAmerica.js";
import SouthAmerica from "./regions/SouthAmerica.js";
import Australia from "./regions/Australia.js";
import Arctic from "./regions/Arctic.js";
import MiddleEast from "./regions/MiddleEast.js";
import Scandinavia from "./regions/Scandinavia.js";
import Balkans from "./regions/Balkans.js";
import Mediterranean from "./regions/Mediterranean.js";

export const Areas = {
    // глобальные
    europe: Europe,
    asia: Asia,
    africa: Africa,
    north_america: NorthAmerica,
    south_america: SouthAmerica,
    australia: Australia,

    // специализированные регионы
    arctic: Arctic,
    middle_east: MiddleEast,
    scandinavia: Scandinavia,
    balkans: Balkans,
    mediterranean: Mediterranean
};
