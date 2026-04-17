import { Game } from "../Game.js";
import { MapManager } from "../MapManager.js";
import { StreetviewElement } from "../StreetviewElement.js";
import { Streetview } from "../Streetview.js";
import { initDuel } from "./duelGame.js";

async function start() {
    let map = decodeURI(location.hash.substring(1));
    window.addEventListener("hashchange", () => {
        location.reload();
    });
    if (map === "") map = "world";

    let geoMap, mapManager = new MapManager();
    await mapManager.initialize();
    
    if (map.startsWith("area#")) {
        let [, lat, lon, radius] = map.split("#").map(n => +n);
        console.log(lat, lon, radius);

        geoMap = mapManager.getAreaMap(lat, lon, radius);
    } else {
        geoMap = await mapManager.getMapByName(map);
    }

    console.log("Map: ", map);

    const game = new Game(geoMap, document.querySelector(".estimator"));
    initDuel(game, geoMap);

    let phrase = "";
    document.addEventListener('keypress', e => {
        phrase += e.key;
        if (phrase.includes("ikbenteake")) {
            phrase = '';
            game.ezMode = true;
            alert("ez mode voor teake enabled");
        }
    });
}

async function waitForGoogle() {
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
}

async function main() {
    await waitForGoogle();
    await start();
}

main();

function goHome() {
    location.href = "../";
}
