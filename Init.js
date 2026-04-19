import { Game } from "./core/Game.js";
import { GameFlow } from "./core/GameFlow.js";
import { GameState } from "./core/GameState.js";

import { Scoring } from "./domain/Scoring.js";
import { LocationGenerator } from "./domain/LocationGenerator.js";
import { Geometry } from "./domain/math/Geometry.js";
import { Difficulty } from "./domain/math/Difficulty.js";

import { AreaRegistry } from "./domain/AreaRegistry.js";

import { MapAdapter } from "./adapters/MapAdapter.js";

import { UIFlow } from "./ui/UIFlow.js";
import { UIBuilder } from "./ui/UIBuilder.js";
import { UIState } from "./ui/UIState.js";

import { MapUI } from "./ui/components/MapUI.js";
import { StreetViewUI } from "./ui/components/StreetViewUI.js";
import { StaticUI } from "./ui/components/StaticUI.js";

export async function init() {
 try {
  console.log("INIT ENTER");

  // =========================
  // ADAPTERS
  // =========================
  const mapAdapter = new MapAdapter();

  // =========================
  // DOMAIN
  // =========================
  const geometry = new Geometry();
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

  // =========================
  // CORE
  // =========================
  const gameState = new GameState();

  const game = new Game({
   gameState,
   players: ["p1"]
  });

  const gameFlow = new GameFlow({
   game,
   generator,
   scoring,
   area
  });

  // =========================
  // UI
  // =========================
  const mapUI = new MapUI({
   adapter: mapAdapter,
   mapElement: document.querySelector(".map"),
   overviewElement: document.querySelector(".overview-map")
  });

  const streetViewUI = new StreetViewUI({
   adapter: mapAdapter,
   element: document.querySelector(".streetview")
  });

  const staticUI = new StaticUI({
   element: document.querySelector(".ui")
  });

  const uiFlow = new UIFlow({
   gameFlow,
   mapUI,
   streetViewUI,
   staticUI,
   uiState: new UIState(),
   uiBuilder: new UIBuilder()
  });

  // =========================
  // INIT UI
  // =========================
  mapUI.init();
  streetViewUI.init();

  // =========================
  // START GAME
  // =========================
  await gameFlow.startGame();

  console.log("INIT EXIT");

 } catch (err) {
  console.error("INIT ERROR:", err);
 }
}

// =========================
// AUTO BOOTSTRAP
// =========================
init().catch(err => {
 console.error("BOOTSTRAP CRASH:", err);
});
