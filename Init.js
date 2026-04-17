import { Game } from "./Game.js";
import { UI } from "./UI.js";
import { Orchestrator } from "./Orchestrator.js";
import { tweaks } from "./Tweaks.js";
import { MapManager } from "./MapManager.js";

// =====================================================
// GOOGLE LOADER
// =====================================================

async function waitForGoogle() {
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
}

// =====================================================
// MAP LOADER
// =====================================================

async function loadMapFromURL() {
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

// =====================================================
// BOOTSTRAP
// =====================================================

async function bootstrap() {
    try {
        await waitForGoogle();

        const map = await loadMapFromURL();

        tweaks();

        // =====================
        // CORE SYSTEM
        // =====================
        const game = new Game(
            map,
            document.querySelector(".estimator")
        );

        const ui = new UI(game);

        const orchestrator = new Orchestrator(game, ui);

        // =====================
        // START GAME BUTTON
        // =====================
        document.getElementById("playBtn")?.addEventListener("click", () => {
            game.startGame();
        });

        // =====================
        // GUESSES (ONLY ENGINE CALL)
        // =====================
        document.getElementById("makeGuess")?.addEventListener("click", () => {
            game.finishGuess();
        });

        console.log("[Init] Boot complete");
    } catch (err) {
        console.error("[Init] Failed:", err);
    }
}

bootstrap();
