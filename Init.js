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

 console.log("🚀 INIT START");

 // =========================
 // ADAPTERS
 // =========================
 console.log("1️⃣ ADAPTERS");

 const mapAdapter = new MapAdapter();
 console.log("   ✔ MapAdapter created");

 // =========================
 // DOMAIN
 // =========================
 console.log("2️⃣ DOMAIN");

 const geometry = new Geometry();
 console.log("   ✔ Geometry");

 console.log("   → loading area...");
 const area = AreaRegistry.get("europe");
 console.log("   ✔ Area loaded:", area.name);

 console.log("   → Difficulty...");
 const difficulty = new Difficulty({ area });
 console.log("   ✔ Difficulty");

 console.log("   → Scoring...");
 const scoring = new Scoring({ geometry, difficulty });
 console.log("   ✔ Scoring");

 console.log("   → LocationGenerator...");
 const generator = new LocationGenerator({
  mapAdapter,
  geometry
 });
 console.log("   ✔ Generator");

 // =========================
 // CORE
 // =========================
 console.log("3️⃣ CORE");

 const gameState = new GameState();
 console.log("   ✔ GameState");

 const game = new Game({
  gameState,
  players: ["p1"]
 });
 console.log("   ✔ Game");

 const gameFlow = new GameFlow({
  game,
  generator,
  scoring,
  area
 });
 console.log("   ✔ GameFlow");

 // =========================
 // UI
 // =========================
 console.log("4️⃣ UI");

 const mapUI = new MapUI({
  adapter: mapAdapter,
  mapElement: document.querySelector(".map"),
  overviewElement: document.querySelector(".overview-map")
 });
 console.log("   ✔ MapUI");

 const streetViewUI = new StreetViewUI({
  adapter: mapAdapter,
  element: document.querySelector(".street-view")
 });
 console.log("   ✔ StreetViewUI");

 const staticUI = new StaticUI({
  element: document.querySelector(".ui")
 });
 console.log("   ✔ StaticUI");

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
 console.log("   ✔ UIFlow");

 // =========================
 // INIT UI
 // =========================
 console.log("5️⃣ INIT UI COMPONENTS");

 mapUI.init();
 streetViewUI.init();

 console.log("6️⃣ START GAME");

 await gameFlow.startGame();

 console.log("🎮 GAME STARTED");
}
