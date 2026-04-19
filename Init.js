import { Game } from "./core/Game.js";
import { GameState } from "./core/GameState.js";
import { GameFlow } from "./core/GameFlow.js";

import { Geometry } from "./domain/Geometry.js";
import { Scoring } from "./domain/Scoring.js";
import { AreaRegistry } from "./domain/AreaRegistry.js";

import { MapAdapter } from "./adapters/MapAdapter.js";
import { LocationGenerator } from "./adapters/LocationGenerator.js";

import { MapUI } from "./ui/MapUI.js";
import { StreetViewUI } from "./ui/StreetViewUI.js";
import { StaticUI } from "./ui/StaticUI.js";

import { UIBuilder } from "./ui/UIBuilder.js";
import { UIState } from "./ui/UIState.js";
import { UIFlow } from "./ui/UIFlow.js";

import { tweaks } from "./ui/Tweaks.js";

// =========================
// utils
// =========================

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

// =========================
// BOOTSTRAP
// =========================

async function bootstrap() {
 try {
  console.log("[Init] START");

  // 1. external deps
  await waitForGoogle();
  tweaks();

  // 2. config + area
  const config = loadConfig();
  const area = AreaRegistry.get(config.area);

  // 3. DOM root
  const root = document.querySelector(".game");

  // 4. domain layer
  const geometry = new Geometry();
  const scoring = new Scoring(geometry);

  // 5. adapters
  const mapAdapter = new MapAdapter(window.google);
  const generator = new LocationGenerator({
   mapAdapter,
   geometry
  });

  // 6. core game
  const game = new Game({
   gameState: new GameState(),
   scoring
  });

  const gameFlow = new GameFlow({
   game,
   generator,
   area
  });

  // 7. UI components
  const mapUI = new MapUI({
   adapter: mapAdapter,
   mapElement: root.querySelector(".map"),
   overviewElement: root.querySelector(".overview-map")
  });

  const streetViewUI = new StreetViewUI({
   adapter: mapAdapter,
   element: root.querySelector(".streetview")
  });

  const staticUI = new StaticUI({
   element: root
  });

  // 8. UI layer
  const uiState = new UIState();
  const uiBuilder = new UIBuilder();

  const uiFlow = new UIFlow({
   gameFlow,
   mapUI,
   streetViewUI,
   staticUI,
   uiState,
   uiBuilder
  });

  // =========================
  // WIRING (ВАЖНО)
  // =========================

  mapUI.init();
  streetViewUI.init();

  // input wiring (UI → GAME)
  mapUI.bindGuess((point) => {
   gameFlow.onGuess("p1", point);
  });

  // =========================
  // START GAME
  // =========================

  await gameFlow.startGame();

  console.log("[Init] SUCCESS");

 } catch (err) {
  console.error("[Init] FAILED:", err);
 }
}

bootstrap();
