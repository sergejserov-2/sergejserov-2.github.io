import { Game } from "./core/Game.js";
import { MapUI } from "./core/ui/MapUI.js";
import { StaticUI } from "./core/ui/StaticUI.js";
import { tweaks } from "./core/ui/Tweaks.js";

import { Bridge } from "./core/Bridge.js";
import { Scoring } from "./core/Scoring.js";

import { Geometry } from "./infrastructure/Geometry.js";
import { LocationGenerator } from "./infrastructure/LocationGenerator.js";
import { MapAdapter } from "./infrastructure/MapAdapter.js";

import { AreaRegistry } from "./area/AreaRegistry.js";

async function waitForGoogle() {
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
}

function loadConfig() {
    const raw = localStorage.getItem("gameConfig");
    if (!raw) throw new Error("No gameConfig found in localStorage");
    return JSON.parse(raw);
}

async function bootstrap() {
    try {
        await waitForGoogle();

        tweaks();

        const config = loadConfig();
        const area = AreaRegistry[config.area];

        const element = document.querySelector(".game");

        const geometry = new Geometry();
        const mapAdapter = new MapAdapter(window.google);

        const generator = new LocationGenerator({
            mapAdapter,
            geometry
        });

        const scoring = new Scoring(geometry);

        const game = new Game({
            area,
            element,
            rules: config.rules,
            generator,
            scoring,
            mapAdapter
        });

        const mapUI = new MapUI({ element });
        const staticUI = new StaticUI({ element });

        mapUI.initGuessMap();
        mapUI.initOverviewMap();
        mapUI.initStreetView();

        new Bridge({
            game,
            mapUI,
            staticUI
        });

        game.startGame();

    } catch (err) {
        console.error("[Init] FAILED:", err);
    }
}

bootstrap();
