import { MapManager } from "./MapManager.js";
import { Game } from "./Game.js";
import { UI } from "./UI.js";
import { bindSoloMode } from "./SoloMode.js";

// =========================================================
// START / BOOTSTRAP LAYER
// =========================================================

// ---------- WAIT FOR GOOGLE MAPS ----------

export async function waitForGoogle() {
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
}

// ---------- LOAD MAP FROM URL ----------

export async function loadMapFromURL() {
    let map = decodeURI(location.hash.substring(1));
    if (map === "") map = "world";

    const mapManager = new MapManager();
    await mapManager.initialize();

    if (map.startsWith("area#")) {
        let [, lat, lon, radius] = map.split("#").map(n => +n);
        return mapManager.getAreaMap(lat, lon, radius);
    }

    return await mapManager.getMapByName(map);
}

// =========================================================
// APP BOOTSTRAP ENTRY POINT
// =========================================================

export async function startApp() {

    // ---------- INIT EXTERNAL DEPENDENCIES ----------

    await waitForGoogle();
    const geoMap = await loadMapFromURL();

    // ---------- CREATE CORE LAYERS ----------

    const game = new Game(geoMap);
    const ui = new UI(game);

    // ---------- BIND SYSTEM ----------

    bindSoloMode(game, ui);

    // ---------- DOM ENTRY POINTS ----------

    const playBtn = document.querySelector("#playBtn");

    if (playBtn) {
        playBtn.addEventListener("click", () => {
            game.start();
        });
    }

    console.log("Start.js bootstrap complete");

    return { game, ui };
}
