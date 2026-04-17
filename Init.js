import { Game } from "./Game.js";
import { UI } from "./UI.js";
import { Orchestrator } from "./Orchestrator.js";
import { tweaks } from "./Tweaks.js";
import { MapManager } from "./MapManager.js";

console.log("init file loaded");        


// =====================================================
// GOOGLE
// =====================================================

async function waitForGoogle() {
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
}

// =====================================================
// MAP
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
// URL RULES PARSER (минимальный слой)
// =====================================================

function parseRulesFromURL() {
    const hash = location.hash.substring(1);
    const params = new URLSearchParams(hash);

    return {
        roundCount: +(params.get("rounds") || 5),
        moveLimit: +(params.get("moves") || -1),
        timeLimit: +(params.get("time") || -1),
        panAllowed: params.get("pan") !== "0",
        zoomAllowed: params.get("zoom") !== "0"
    };
}

// =====================================================
// BOOTSTRAP
// =====================================================

async function bootstrap() {
    console.log("INITIALIZATION");        
    try {
        await waitForGoogle();

        const map = await loadMapFromURL();
        const rules = parseRulesFromURL();

        tweaks();

        // =====================
        // CORE
        // =====================
        const game = new Game(
            map,
            document.querySelector(".estimator"),
            rules
        );

        const ui = new UI(game);
        const orchestrator = new Orchestrator(game, ui);

        // =====================
        // PLAY BUTTON
        // =====================
        document.getElementById("playBtn")?.addEventListener("click", () => {
            game.startGame();
        });

        // =====================
        // GUESS BUTTON
        // =====================
        document.getElementById("makeGuess")?.addEventListener("click", () => {
            game.finishGuess();
        });

        // =====================
        // AUTO START (ВАЖНО)
        // =====================
        const params = new URLSearchParams(location.hash.substring(1));
        const autoStart = params.get("autostart");

        if (autoStart !== "0") {
            game.startGame();
        }

        console.log("[Init] Boot complete");
    } catch (err) {
        console.error("[Init] Failed:", err);
    }
}

bootstrap();
