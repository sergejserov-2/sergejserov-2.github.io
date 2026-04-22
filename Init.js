import { Game } from "./core/Game.js";
import { GameState } from "./core/GameState.js";
import { GameFlow } from "./core/GameFlow.js";
import { GameBridge } from "./core/GameBridge.js"

import { Scoring } from "./domain/Scoring.js";
import { Difficulty } from "./domain/math/Difficulty.js";

import { LocationGenerator } from "./domain/LocationGenerator.js";
import { AreaRegistry } from "./domain/AreaRegistry.js";

import { MapAdapter } from "./adapters/MapAdapter.js";
import { StreetViewAdapter } from "./adapters/StreetViewAdapter.js";

import { MapWrapperUI } from "./ui/components/MapWrapperUI.js";
import { MapOverviewUI } from "./ui/components/MapOverviewUI.js";
import { StreetViewUI } from "./ui/components/StreetViewUI.js";
import { StaticUI } from "./ui/components/StaticUI.js";

import { ScreenManager } from "./ui/ScreenManager.js";
import { UIFlow } from "./ui/UIFlow.js";
import { UIBuilder } from "./ui/UIBuilder.js";

import { Tweaks } from "./ui/Tweaks.js";

import { TimerService } from "./services/TimerService.js";
import { MovesService } from "./services/MovesService.js";
import { RoundsService } from "./services/RoundsService.js";

import { getConfig } from "./config/getConfig.js";

// =========================
// GOOGLE MAPS
// =========================
function waitForGoogleMaps() {
 return new Promise(resolve => {
  const check = () => {
   if (window.google?.maps) resolve();
   else setTimeout(check, 50);
  };
  check();
 });
}

// =========================
// INIT
// =========================
export async function init() {
 console.log("INIT START");

 await waitForGoogleMaps();

 // =========================
 // CONFIG
 // =========================
 const config = getConfig();

 // =========================
 // DOM
 // =========================
 const hud = document.querySelector(".hud");
 const mapEl = document.querySelector(".map");
 const streetEl = document.querySelector(".streetview");
 const screensEl = document.querySelector(".screens");

 const roundOverviewMapEl = document.querySelector(
  ".round-result .overview-map"
 );

 const gameOverviewMapEl = document.querySelector(
  ".game-result .overview-map"
 );

 const guessBtn = document.querySelector("#makeGuess");
 const polygonBtn = document.querySelector(".polygon-button");

 // =========================
 // DOMAIN
 // =========================
 const area = AreaRegistry.get(config.area || "europe");
 const difficulty = new Difficulty();
 const scoring = new Scoring({ difficulty });

 // =========================
 // SERVICES
 // =========================
 const services = {
  timer: new TimerService(),
  moves: new MovesService(),
  rounds: new RoundsService()
 };

 // =========================
 // ADAPTERS
 // =========================
 const streetAdapter = new StreetViewAdapter();
 const mapAdapter = new MapAdapter();

 // =========================
 // CORE
 // =========================
 const gameState = new GameState();

 const game = new Game({
  gameState,
  scoring,
  players: ["p1"],
  config
 });

 const generator = new LocationGenerator({
  streetAdapter
 });

 const gameFlow = new GameFlow({
  game,
  generator,
  area,
  services
 });

const gameBridge = new GameBridge({
 gameFlow,
 mode: config.mode, // "solo" | "duel"
 network: null
});
 
 // =========================
 // UI BUILDER
 // =========================
 const uiBuilder = new UIBuilder();
 uiBuilder.setConfig(config);

 // =========================
 // UI COMPONENTS
 // =========================
 const mapWrapperUI = new MapWrapperUI({
  adapter: mapAdapter,
  element: mapEl,
  uiBuilder
 });

 const streetViewUI = new StreetViewUI({
  adapter: streetAdapter,
  element: streetEl
 });

 const staticUI = new StaticUI({
  hudElement: hud,
  uiBuilder: uiBuilder
 });

 const screenManager = new ScreenManager({
  root: screensEl
 });

 const roundOverviewUI = new MapOverviewUI({
  adapter: mapAdapter,
  element: roundOverviewMapEl,
  uiBuilder
 });

 const gameOverviewUI = new MapOverviewUI({
  adapter: mapAdapter,
  element: gameOverviewMapEl,
  uiBuilder
 });

 roundOverviewUI.init();
 gameOverviewUI.init();
// =========================
 // UI FLOW
 // =========================
new UIFlow({
 gameFlow: gameBridge,
 screenManager,
 staticUI,
 uiBuilder,
 streetViewUI,
 mapWrapperUI,
 roundOverviewUI,
 gameOverviewUI
});

 // =========================
 // STREET VIEW
 // =========================
streetViewUI.onReady = () => {
 gameBridge.streetViewReady();
};


 gameFlow.on("streetViewSetLocation", (location) => {
  streetViewUI.setLocation(location);
 });

 streetViewUI.init({ lat: 0, lng: 0 });

 // =========================
 // 🔥 MOVES (ЕДИНСТВЕННАЯ ТОЧКА)
 // =========================
streetViewUI.onMove = () => {
 gameBridge.registerMove();
};

 // =========================
 // MAP
 // =========================
 mapWrapperUI.init();
 mapWrapperUI.reset();

 mapWrapperUI.setArea(area);
 mapWrapperUI.bindPolygonButton(polygonBtn);

 // =========================
 // INPUT
 // =========================
mapWrapperUI.bindGuess((point) => {
 gameBridge.finishGuess(point);
});

 mapWrapperUI.bindGuessButton(guessBtn);

 // =========================
 // TWEAKS
 // =========================
 const tweaks = new Tweaks({
  mapElement: mapEl,
  streetElement: streetEl,
  root: screensEl
 });

 tweaks.apply();

 // =========================
 // START GAME
 // =========================
 await gameFlow.startGame();

 console.log("INIT OK");
}

init();
