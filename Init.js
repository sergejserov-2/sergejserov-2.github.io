import { Game } from "./core/Game.js";
import { GameState } from "./core/GameState.js";
import { GameFlow } from "./core/GameFlow.js";

import { Scoring } from "./domain/Scoring.js";
import { Difficulty } from "./domain/math/Difficulty.js";

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

import { Tweaks } from "./ui/Tweaks.js";

// =========================
// GOOGLE MAPS GATE
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
 // DOM
 // =========================
 const hud = document.querySelector(".hud");
 const mapEl = document.querySelector(".map");
 const streetEl = document.querySelector(".streetview");
 const screensEl = document.querySelector(".screens");
 const overviewMapEl = document.querySelector(".overview-map");
 const guessBtn = document.querySelector("#makeGuess");

 // =========================
 // ADAPTERS
 // =========================
 const mapAdapter = new MapAdapter();
 const streetAdapter = new StreetViewAdapter();

 // =========================
 // DOMAIN
 // =========================
 const area = AreaRegistry.get("europe");
 const difficulty = new Difficulty();
 const scoring = new Scoring({ difficulty });

 // =========================
 // CORE
 // =========================
 const gameState = new GameState();

 const game = new Game({
  gameState,
  scoring,
  players: ["p1"]
 });

 const generator = new LocationGenerator({
  mapAdapter
 });

 const gameFlow = new GameFlow({
  game,
  generator,
  area
 });

 // =========================
 // UI
 // =========================
 const mapUI = new MapUI({
  adapter: mapAdapter,
  mapElement: mapEl,
  overviewElement: overviewMapEl,
  uiBuilder
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

 new UIFlow({
  gameFlow,
  screenManager,
  staticUI,
  streetViewUI,
  mapUI
 });

 // =========================
 // UI INIT
 // =========================
 mapUI.init();
 streetViewUI.init({ lat: 0, lng: 0 });
 mapUI.reset();

 // =========================
 // GAME HOOKS
 // =========================
 mapUI.bindGuess((point) => {
  gameFlow.finishGuess(point);
 });

 mapUI.bindGuessButton(guessBtn);

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
 // START
 // =========================
 await gameFlow.startGame();

 console.log("INIT OK");
}

init();
