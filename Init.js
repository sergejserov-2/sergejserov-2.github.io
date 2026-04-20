import { Game } from "./core/Game.js";
import { GameState } from "./core/GameState.js";
import { GameFlow } from "./core/GameFlow.js";

import { Scoring } from "./domain/Scoring.js";
import { Geometry } from "./domain/math/Geometry.js";
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

import { Tweaks } from "./ui/tweaks.js";

export async function init() {
 try {
  const hud = document.querySelector(".hud");
  const mapEl = document.querySelector(".map");
  const streetEl = document.querySelector(".streetview");
  const screensEl = document.querySelector(".screens");
  const overviewMapEl = document.querySelector(".overview-map");
  const guessBtn = document.querySelector("#makeGuess");

  if (!hud || !mapEl || !streetEl || !screensEl) {
   throw new Error("Missing DOM elements");
  }

  const mapAdapter = new MapAdapter();
  const streetAdapter = new StreetViewAdapter();

  await mapAdapter.ensureReady();

  const area = AreaRegistry.get("europe");

  const difficulty = new Difficulty();

  const scoring = new Scoring({ difficulty });

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

  const uiFlow = new UIFlow({
   gameFlow,
   screenManager,
   staticUI,
   uiBuilder,
   streetViewUI
  });

  mapUI.init();
  streetViewUI.init({ lat: 0, lng: 0 });

  mapUI.bindGuess((point) => {
   gameFlow.finishGuess(point);
  });

  mapUI.bindGuessButton(guessBtn);

  const tweaks = new Tweaks();

  await gameFlow.startGame();

  console.log("INIT OK");
 } catch (err) {
  console.error("INIT ERROR:", err);
 }
}

init();
