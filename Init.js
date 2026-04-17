import { Game } from "./Game.js";
import { UI } from "./UI.js";
import { Route } from "./SoloMode.js";

// =========================================================
// GOOGLE MAPS WAIT
// =========================================================

export async function waitForGoogle() {
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
}

// =========================================================
// MAP LOADER
// =========================================================

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
// APP BOOTSTRAP
// =========================================================

export async function startApp() {

    // ---------- INIT ----------
    await waitForGoogle();
    const geoMap = await loadMapFromURL();

    // ---------- CORE ----------
    const game = new Game(geoMap);
    const ui = new UI(game);

    // ---------- BIND GAME ↔ UI ----------
    bindSoloMode(game, ui);

    // =====================================================
    // DOM BINDS (ENTRY LAYER ONLY)
    // =====================================================

    // ---------- START GAME ----------
    const playBtn = document.querySelector("#playBtn");
    if (playBtn) {
        playBtn.addEventListener("click", () => {
            game.startGame();
        });
    }

    // ---------- MAKE GUESS ----------
    const makeGuessBtn = document.getElementById("makeGuess");
    if (makeGuessBtn) {
        makeGuessBtn.addEventListener("click", () => {
            game.finishGuess();
        });
    }

    // ---------- RETURN HOME (MAP / STREETVIEW) ----------
    const returnHomeBtn = document.getElementById("returnHome");
    if (returnHomeBtn) {
        returnHomeBtn.addEventListener("click", () => {
            ui.returnHome();
        });
    }

    // ---------- MAP OVERLAY TOGGLE ----------
    const mapOverlayBtn = document.getElementById("mapOverlay");
    if (mapOverlayBtn) {
        mapOverlayBtn.addEventListener("click", () => {
            ui.toggleMapOverlay();
        });
    }

    console.log("🚀 App started (Start.js bootstrap complete)");

    return { game, ui };
}
