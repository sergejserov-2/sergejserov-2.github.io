import { MapManager } from "./MapManager.js";

export async function loadMapFromURL() {
    let map = decodeURI(location.hash.substring(1));
    if (map === "") map = "world";
    const mapManager = new MapManager();
    await mapManager.initialize();
    
    let geoMap;    
    if (map.startsWith("area#")) {
        let [, lat, lon, radius] = map.split("#").map(n => +n);
        return mapManager.getAreaMap(lat, lon, radius);
    } 
    return await mapManager.getMapByName(map);
}

export async function waitForGoogle() {
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
}
