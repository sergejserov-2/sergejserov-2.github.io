import { Game } from "./core/Game.js";
import { GameFlow } from "./core/GameFlow.js";
import { GameState } from "./core/GameState.js";
import { Bridge } from "./core/Bridge.js";
import { Emitter } from "./core/Emitter.js";
import { ViewModelBuilder } from "./core/ViewModelBuilder.js";

import { Geometry } from "./domain/Geometry.js";
import { Scoring } from "./domain/Scoring.js";
import { AreaRegistry } from "./domain/AreaRegistry.js";

import { MapAdapter } from "./adapters/MapAdapter.js";
import { LocationGenerator } from "./adapters/LocationGenerator.js";

import { MapUI } from "./ui/MapUI.js";
import { StreetViewUI } from "./ui/StreetviewUI.js";
import { StaticUI } from "./ui/StaticUI.js";
import { tweaks } from "./ui/Tweaks.js";

function waitForGoogle() {
    return new Promise(resolve => {
        const check = () => {
            if (window.google?.maps) resolve();
            else setTimeout(check, 50);
        };
        check();
    });
}

function loadConfig() {
    const raw = localStorage.getItem("gameConfig");
    if (!raw) throw new Error("No gameConfig found");
    return JSON.parse(raw);
}

async function bootstrap() {
    try {
        console.log("[Init] START");

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
            gameState: new GameState(),
            generator,
            scoring
        });

        const mapUI = new MapUI({ element });
        const streetViewUI = new StreetViewUI({ element });
        const staticUI = new StaticUI({ element });

        mapUI.initGuessMap();
        mapUI.initOverviewMap();
        streetViewUI.init();

        new Bridge({
            game,
            mapUI,
            streetViewUI,
            staticUI,
            viewModelBuilder: new ViewModelBuilder()
        });

        game.startGame();

        console.log("[Init] SUCCESS");
    } catch (err) {
        console.error("[Init] FAILED:", err);
    }
}

bootstrap();
