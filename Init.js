import { Game } from "./game/Game.js";
import { GameState } from "./game/GameState.js";
import { GameFlow } from "./game/GameFlow.js";

import { Scoring } from "./core/Scoring.js";
import { Geometry } from "./core/Geometry.js";
import { Difficulty } from "./core/Difficulty.js";

import { LocationGenerator } from "./domain/LocationGenerator.js";
import { AreaRegistry } from "./domain/AreaRegistry.js";

import { MapAdapter } from "./adapters/MapAdapter.js";
import { StreetViewAdapter } from "./adapters/StreetViewAdapter.js";

import { MapUI } from "./ui/components/MapUI.js";
import { StreetViewUI } from "./ui/components/StreetViewUI.js";
import { StaticUI } from "./ui/components/StaticUI.js";

import { ScreenManager } from "./ui/ScreenManager.js";
import { UIFlow } from "./ui/UIFlow.js";
import { UIBuilder } from "./ui/UIBuilder.js";

// =========================
// BOOTSTRAP
// =========================

export async function init() {
 console.log("🚀 INIT START");

 try {

  // =========================
  // DOM
  // =========================
  const hud = document.querySelector(".hud");
  const mapEl = document.querySelector(".map");
  const streetEl = document.querySelector(".streetview");
  const screensEl = document.querySelector(".screens");
  const overviewMapEl = document.querySelector(".overview-map");

  if (!hud  !mapEl  !streetEl || !screensEl) {
   throw new Error("Missing DOM elements");
  }

  // =========================
  // CORE (RULES)
  // =========================
  const geometry = Geometry;

  const area = AreaRegistry.get("europe");

  const difficulty = new Difficulty({
   area
  });

  const scoring = new Scoring({
   geometry,
   difficulty
  });

  const gameState = new GameState();

  const game = new Game({
   gameState,
   scoring,
   players: ["p1"]
  });

  // =========================
  // GAME FLOW
  // =========================
  const gameFlow = new GameFlow({
   game,
   generator: new LocationGenerator({
    mapAdapter: new MapAdapter(),
    geometry
   }),
   area
  });

  // =========================
  // ADAPTERS
  // =========================
  const mapAdapter = new MapAdapter();
  const streetAdapter = new StreetViewAdapter();

  // =========================
  // UI COMPONENTS
  // =========================
  const mapUI = new MapUI({
   adapter: mapAdapter,
   mapElement: mapEl,
   overviewElement: overviewMapEl
  });

  const streetViewUI = new StreetViewUI({
   adapter: streetAdapter,
   element: streetEl
  });

  const staticUI = new StaticUI({
   hudElement: hud
  });

  const screenManager = new ScreenManager({
   root: screensEl
  });

  const uiBuilder = new UIBuilder();

  // =========================
  // UI FLOW (EVENT LAYER)
  // =========================
  const uiFlow = new UIFlow({
   gameFlow,
   screenManager,
   staticUI,
   uiBuilder
  });

  // =========================
  // INIT UI
  // =========================
  mapUI.init();
  streetViewUI.init({ lat: 0, lng: 0 });

  // =========================
  // START GAME
  // =========================
  await gameFlow.startGame();

  console.log("✅ INIT OK");

 } catch (err) {
  console.error("💥 INIT ERROR:", err);
 }
}

// =========================
// START
// =========================
init();
