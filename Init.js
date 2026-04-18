import { Game } from "./Game.js";
import { UI } from "./UI.js";
import { Orchestrator } from "./Orchestrator.js";
import { tweaks } from "./Tweaks.js";
import { MapManager } from "./MapManager.js";
import { MapAdapter } from "./MapAdapter.js";

console.log("[Init] file loaded");

// =====================================================
// GOOGLE
// =====================================================

async function waitForGoogle() {
    console.log("[Init] waiting for Google Maps...");
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
    console.log("[Init] Google Maps ready");
}

// =====================================================
// PLAY AREA
// =====================================================

async function loadPlayAreaFromURL() {
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
    console.log("[Init] bootstrap start");


    

    try {
        await waitForGoogle();

        const playArea = await loadPlayAreaFromURL();
        const element = document.querySelector(".estimator");

        tweaks();

        // =====================
        // CORE WILL BE CREATED ON PLAY
        // =====================

        let game = null;
        let ui = null;
        let orchestrator = null;

        // =====================
        // PLAY BUTTON
        // =====================

        document.getElementById("playBtn")?.addEventListener("click", () => {

            const rules = {
                roundCount: 5,
                moveLimit: -1,
                timeLimit: -1,
                panAllowed: true,
                zoomAllowed: true
            };
            
            const mapAdapter = new MapAdapter(window.google);

            game = new Game(playArea, element, rules, mapAdapter);
            ui = new UI(game);
            orchestrator = new Orchestrator(game, ui);

            game.startGame();
        });

        // =====================
        // OTHER CONTROLS
        // =====================

        document.getElementById("makeGuess")?.addEventListener("click", () => {
            game?.finishGuess();
        });

        document.getElementById("returnHome")?.addEventListener("click", () => {
            ui?.returnHome();
        });

        document.getElementById("mapOverlay")?.addEventListener("click", () => {
            ui?.toggleMapOverlay();
        });

        console.log("[Init] boot complete (waiting for play)");

    } catch (err) {
        console.error("[Init] FAILED:", err);
    }
}

bootstrap();
