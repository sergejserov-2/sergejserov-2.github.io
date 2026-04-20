import { Game } from "./core/Game.js";
import { GameFlow } from "./core/GameFlow.js";
import { GameState } from "./core/GameState.js";

import { Scoring } from "./domain/Scoring.js";
import { LocationGenerator } from "./domain/LocationGenerator.js";
import { Geometry } from "./domain/math/Geometry.js";
import { Difficulty } from "./domain/math/Difficulty.js";
import { AreaRegistry } from "./domain/AreaRegistry.js";

import { MapAdapter } from "./adapters/MapAdapter.js";

import { MapUI } from "./ui/components/MapUI.js";
import { StreetViewUI } from "./ui/components/StreetViewUI.js";

import { StaticUI } from "./ui/components/StaticUI.js";
import { ScreenManager } from "./ui/components/ScreenManager.js";

import { UIFlow } from "./ui/UIFlow.js";
import { UIBuilder } from "./ui/UIBuilder.js";
import { UIState } from "./ui/UIState.js";

import { tweaks } from "./ui/tweaks.js";

export async function init() {
 console.log("INIT ENTER");

 try {

  const hud = document.querySelector(".hud");
  const mapEl = document.querySelector(".map");
  const streetEl = document.querySelector(".streetview");
  const screensEl = document.querySelector(".screens");
  const overviewMapEl = document.querySelector(".overview-map");

  if (!hud || !mapEl || !streetEl || !screensEl) {
   throw new Error("INIT: missing DOM elements");
  }

  const mapAdapter = new MapAdapter();

  const geometry = Geometry;

  const area = AreaRegistry.get("europe");

  const difficulty = new Difficulty({ area });

  const scoring = new Scoring({
   geometry,
   difficulty
  });

  const generator = new LocationGenerator({
   mapAdapter,
   geometry
  });

  const gameState = new GameState();

  const game = new Game({
   gameState,
   scoring,
   players: ["p1"]
  });

  const gameFlow = new GameFlow({
   game,
   generator,
   area
  });

  const mapUI = new MapUI({
   adapter: mapAdapter,
   mapElement: mapEl,
   overviewElement: overviewMapEl
  });

  const streetViewUI = new StreetViewUI({
   adapter: mapAdapter,
   element: streetEl
  });

  const staticUI = new StaticUI({
   hudElement: hud,
   mapElement: mapEl,
   streetViewElement: streetEl
  });

  const screenManager = new ScreenManager({
   screensElement: screensEl
  });

  const uiState = new UIState();
  const uiBuilder = new UIBuilder();

  const uiFlow = new UIFlow({
   gameFlow,
   mapUI,
   streetViewUI,
   staticUI,
   screenManager,
   uiState,
   uiBuilder
  });

  mapUI.init();
  streetViewUI.init();

  tweaks();

  await gameFlow.startGame();

  console.log("INIT SUCCESS");

 } catch (err) {
  console.error("💥 INIT ERROR:", err);
 }
}

init();
