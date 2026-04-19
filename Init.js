import { Game } from "./core/Game.js";
import { Bridge } from "./core/Bridge.js";
import { StaticUI } from "./core/ui/StaticUI.js";
import { MapUI } from "./core/ui/MapUI.js";
import { StreetViewUI } from "./core/ui/StreetViewUI.js";
import { tweaks } from "./core/ui/Tweaks.js";

import { Scoring } from "./core/Scoring.js";
import { Geometry } from "./infrastructure/Geometry.js";
import { LocationGenerator } from "./infrastructure/LocationGenerator.js";
import { MapAdapter } from "./infrastructure/MapAdapter.js";
import { AreaRegistry } from "./area/AreaRegistry.js";
import { ViewModelBuilder } from "./core/ViewModelBuilder.js";

async function waitForGoogle() {
    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));
    }
}

function loadConfig() {
    const raw = localStorage.getItem("gameConfig");
    if (!raw) throw new Error("No gameConfig found");
    return JSON.parse(raw);
}

async function bootstrap() {
    try {
        await waitForGoogle();

        tweaks();

        const config = loadConfig();
        const area = AreaRegistry[config.area];

        const root = document.querySelector(".game");

        const geometry = new Geometry();
        const mapAdapter = new MapAdapter();

        const generator = new LocationGenerator({
            mapAdapter,
            geometry
        });

        const scoring = new Scoring(geometry);

        const game = new Game({
            area,
            rules: config.rules,
            generator,
            scoring
        });

        const mapUI = new MapUI({
            adapter: mapAdapter,
            mapElement: root.querySelector(".map"),
            overviewElement: root.querySelector(".overview")
        });

        const streetViewUI = new StreetViewUI({
            adapter: mapAdapter,
            element: root.querySelector(".streetview")
        });

        const staticUI = new StaticUI({ element: root });

        const vm = new ViewModelBuilder(game);

        mapUI.init();
        streetViewUI.init();

        new Bridge({
            game,
            ui: {
                map: mapUI,
                streetview: streetViewUI,
                static: staticUI
            },
            vm
        });

        game.startGame();

    } catch (err) {
        console.error("[Init] FAILED:", err);
    }
}

bootstrap();
