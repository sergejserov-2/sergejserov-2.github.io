import { Game } from "./core/Game.js";
import { GameFlow } from "./core/GameFlow.js";
import { Bridge } from "./core/Bridge.js";
import { ViewModelBuilder } from "./core/ViewModelBuilder.js";
import { Scoring } from "./core/Scoring.js";

import { Geometry } from "./domain/Geometry.js";
import { LocationGenerator } from "./domain/LocationGenerator.js";

import { MapAdapter } from "./adapters/MapAdapter.js";

import { MapUI } from "./ui/MapUI.js";
import { StreetViewUI } from "./ui/StreetViewUI.js";
import { StaticUI } from "./ui/StaticUI.js";
import { Tweaks } from "./ui/Tweaks.js";

import { AreaRegistry } from "./area/AreaRegistry.js";

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
    await waitForGoogle();

    Tweaks();

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
        gameState: config.gameState,
        scoring
    });

    const gameFlow = new GameFlow({
        game,
        generator,
        area
    });

    const mapUI = new MapUI({
        adapter: mapAdapter,
        mapElement: root
