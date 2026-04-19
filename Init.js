import { Game } from "./core/Game.js";
import { GameState } from "./core/GameState.js";
import { GameFlow } from "./core/GameFlow.js";

import { Geometry } from "./domain/Geometry.js";
import { Scoring } from "./domain/Scoring.js";
import { AreaRegistry } from "./domain/AreaRegistry.js";

import { MapAdapter } from "./adapters/MapAdapter.js";
import { LocationGenerator } from "./adapters/LocationGenerator.js";

// =========================
// UI CORE
// =========================

import { UIFlow } from "./ui/UIFlow.js";
import { UIState } from "./ui/UIState.js";
import { UIBuilder } from "./ui/UIBuilder.js";

import { MapUI } from "./ui/components/MapUI.js";
import { StreetViewUI } from "./ui/components/StreetViewUI.js";
import { StaticUI } from "./ui/components/StaticUI.js";

import { tweaks } from "./ui/Tweaks.js";

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

async function bootstrap() {
 try {
  console.log("[Init] START");

  await waitForGoogle();
  tweaks();

  const config = loadConfig();
  const area = AreaRegistry.get(config.area);

  const root = document.querySelector(".game");

  // =========================
  // DOMAIN
  // =========================

  const geometry = new Geometry();
  const scoring = new Scoring(geometry);

  // =========================
  // ADAPTERS
  // =========================

  const mapAdapter = new MapAdapter(window.google);

  const generator = new LocationGenerator({
   mapAdapter,
   geometry
  });

  // =========================
  // CORE GAME
  // =========================

  const game = new Game({
   gameState: new GameState(),
   scoring
  });

  const gameFlow = new GameFlow({
   game,
   generator,
   area
  });

  // =========================
  // UI COMPONENTS
  // =========================

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

  // =========================
  // UI LAYER
  // =========================

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
  // INIT UI
  // =========================

  mapUI.init();
  streetViewUI.init();

  // UIFlow сам связывает input
  uiFlow.connectInput();

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
