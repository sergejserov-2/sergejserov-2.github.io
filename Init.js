import { Game } from "./Game.js";
import { UI } from "./UI.js";
import { Bridge } from "./Bridge.js";

import { LocationGenerator } from "./Infrastructure/LocationGenerator.js";
import { Scoring } from "./core/Scoring.js";
import { Geometry } from "./core/Geometry.js";
import { MapAdapter } from "./Infrastructure/MapAdapter.js";

import { tweaks } from "./Tweaks.js";

console.log("[Init] loaded");

// =====================================================
// GOOGLE WAIT
// =====================================================

async function waitForGoogle() {
    console.log("[Init] waiting for Google Maps...");

    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }

    console.log("[Init] Google Maps ready");
}

// =====================================================
// CONFIG LOAD
// =====================================================

function loadConfig() {
    const raw = localStorage.getItem("gameConfig");

    if (!raw) {
        throw new Error("No gameConfig found in localStorage");
    }

    return JSON.parse(raw);
}

// =====================================================
// BOOTSTRAP
// =====================================================

async function bootstrap() {
    try {
        console.log("[Init] bootstrap start");

        // 1. WAIT GOOGLE
        await waitForGoogle();

        // 2. TWEEKS (must stay as you requested)
        tweaks();

        // 3. CONFIG
        const config = loadConfig();
        console.log("[Init] config:", config);

        // 4. ROOT
        const element = document.querySelector(".game-root");

        // =====================================================
        // CORE SYSTEMS (PURE)
        // =====================================================

        const geometry = new Geometry();
        const mapAdapter = new MapAdapter(window.google);

        const generator = new LocationGenerator(mapAdapter, geometry);
        const scoring = new Scoring(geometry);

        // =====================================================
        // GAME
        // =====================================================

        const game = new Game({
            area: config.area,
            element,
            rules: config.rules,
            generator,
            scoring,
            mapAdapter
        });

        // =====================================================
        // UI
        // =====================================================

        const ui = new UI(game);

        // =====================================================
        // BRIDGE (EVENT WIRING)
        // =====================================================

        new Bridge({ game, ui });

        // =====================================================
        // START
        // =====================================================

        game.startGame();

        console.log("[Init] game started");

    } catch (err) {
        console.error("[Init] FAILED:", err);
    }
}

bootstrap();
