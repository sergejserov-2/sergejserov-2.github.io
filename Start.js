import { MapManager } from "./MapManager.js";
import { Game } from "./Game.js";
import { UI } from "./UI.js";
import { bindSoloMode } from "./SoloMode.js";

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
// BOOTSTRAP ENTRY
// =========================================================

export async function startApp() {

    // ---------- INIT ----------
    await waitForGoogle();
    const geoMap = await loadMapFromURL();

    // ---------- CORE SYSTEM ----------
    const game = new Game(geoMap);
    const ui = new UI(game);

    // ---------- EVENT BRIDGE ----------
    bindSoloMode(game, ui);

    // =====================================================
    // DOM BINDS
    // =====================================================

    const makeGuessBtn = document.getElementById("makeGuess");
    if (makeGuessBtn) {
        makeGuessBtn.addEventListener("click", () => {
            game.finishGuess?.(); // или game.makeGuess() если так у тебя задумано
        });
    }

    const returnHomeBtn = document.getElementById("returnHome");
    if (returnHomeBtn) {
        returnHomeBtn.addEventListener("click", () => {
            ui.returnHome();
        });
    }

    const mapOverlayBtn = document.getElementById("mapOverlay");
    if (mapOverlayBtn) {
        mapOverlayBtn.addEventListener("click", () => {
            ui
