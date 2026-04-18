import { Game } from "./core/Game.js";

import { MapUI } from "./core/ui/MapUI.js";
import { StaticUI } from "./core/ui/StaticUI.js";
import { tweaks } from "./core/ui/Tweaks.js";

import { Bridge } from "./core/Bridge.js";
import { Scoring } from "./core/Scoring.js";
import { Geometry } from "./core/Geometry.js";

import { LocationGenerator } from "./infrastructure/LocationGenerator.js";
import { MapAdapter } from "./infrastructure/MapAdapter.js";

import { AreaRegistry } from "./area/Area.js";

console.log("[Init] loaded");

// GOOGLE WAIT

async function waitForGoogle() {
    console.log("[Init] waiting for Google Maps...");

    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }

    console.log("[Init] Google Maps ready");
}

// CONFIG

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

        // 1. Google
        await waitForGoogle();

        // 2. UI tweaks (оставляем как есть)
        tweaks();

        // 3. Config
        const config = loadConfig();
        console.log("[Init] config:", config);

        // 4. Resolve AREA (ключ → объект)
        const area = AreaRegistry[config.area];

        if (!area) {
            throw new Error(`Unknown area: ${config.area}`);
        }

        // 5. Root element
        const element = document.querySelector(".game-root");

        // CORE

        const geometry = new Geometry();
        const mapAdapter = new MapAdapter(window.google);

        const generator = new LocationGenerator({
            mapAdapter,
            geometry
        });

        const scoring = new Scoring(geometry);

        // =====================================================
        // GAME
        // =====================================================

        const game = new Game({
            area,
            element,
            rules: config.rules,
            generator,
            scoring,
            mapAdapter
        });

        // =====================================================
        // UI
        // =====================================================

        const mapUI = new MapUI(game);
        const staticUI = new StaticUI(game);

        // =====================================================
        // BRIDGE
        // =====================================================

        new Bridge({
            game,
            mapUI,
            staticUI
        });

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
