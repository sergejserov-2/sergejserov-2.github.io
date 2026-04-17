import { Game } from "./Game.js";
import { UI } from "./UI.js";
import { EventRouter } from "./EventRouter.js";
import { tweaks } from "./Tweaks.js";
import { MapManager } from "./MapManager.js";

// =====================================================
// INTERNAL UTILS (НЕ EXPORT)
// =====================================================

async function waitForGoogle() {
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
}

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

    await waitForGoogle();

    const map = await loadMapFromURL();

    tweaks();

    const game = new Game(map, document.querySelector(".estimator"));
    const ui = new UI(game);

    const router = new EventRouter(game, ui);
    router.bind();

    document.getElementById("playBtn")?.addEventListener("click", () => {
        game.startGame();
    });

    document.getElementById("makeGuess")?.addEventListener("click", () => {
        game.finishGuess();
    });

    document.getElementById("returnHome")?.addEventListener("click", () => {
        ui.returnHome();
    });

    document.getElementById("mapOverlay")?.addEventListener("click", () => {
        ui.toggleMapOverlay();
    });

    console.log("[Init] Boot complete");
}

bootstrap().catch(err => {
    console.error("[Init] Failed:", err);
});
