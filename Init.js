import { Game } from "./core/Game.js";
import { GameState } from "./core/GameState.js";
import { GameFlow } from "./core/GameFlow.js";
import { Scoring } from "./domain/Scoring.js";
import { Difficulty } from "./domain/math/Difficulty.js";
import { LocationGenerator } from "./domain/LocationGenerator.js";
import { AreaRegistry } from "./domain/AreaRegistry.js";
import { MapAdapter } from "./adapters/MapAdapter.js";
import { StreetViewAdapter } from "./adapters/StreetViewAdapter.js";
import { TimerService } from "./services/TimerService.js";
import { MovesService } from "./services/MovesService.js";
import { RoundsService } from "./services/RoundsService.js";
import { MapWrapperUI } from "./ui/components/MapWrapperUI.js";
import { MapOverviewUI } from "./ui/components/MapOverviewUI.js";
import { StreetViewUI } from "./ui/components/StreetViewUI.js";
import { StaticUI } from "./ui/components/StaticUI.js";

import { ScreenManager } from "./ui/ScreenManager.js";
import { UIFlow } from "./ui/UIFlow.js";
import { UIBuilder } from "./ui/UIBuilder.js";

import { Tweaks } from "./ui/Tweaks.js";

function waitForGoogleMaps() {
 return new Promise(resolve => {
  const check = () => {
   if (window.google?.maps) resolve();
   else setTimeout(check, 50);
  };
  check();
 });
}

export async function init() {
 console.log("INIT START");

 await waitForGoogleMaps();

 const hud = document.querySelector(".hud");
 const mapEl = document.querySelector(".map");
 const streetEl = document.querySelector(".streetview");
 const screensEl = document.querySelector(".screens");
 const overviewMapEl = document.querySelector(".overview-map");
 const guessBtn = document.querySelector("#makeGuess");

 const mapAdapter = new MapAdapter();
 const streetAdapter = new StreetViewAdapter();

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
  streetAdapter
 });

 const services = {
  timer: new TimerService(),
  moves: new MovesService(),
  rounds: new RoundsService()
 };

 const gameFlow = new GameFlow({
  game,
  generator,
  area,
  services
 });

 const uiBuilder = new UIBuilder();

 const mapWrapperUI = new MapWrapperUI({
  adapter: mapAdapter,
  element: mapEl,
  uiBuilder
 });

 const mapOverviewUI = new MapOverviewUI({
  adapter: mapAdapter,
  element: overviewMapEl,
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

 new UIFlow({
  gameFlow,
  screenManager,
  staticUI,
  uiBuilder,
  streetViewUI,
  mapWrapperUI,
  mapOverviewUI
 });

 mapWrapperUI.init();
 mapOverviewUI.init();
 streetViewUI.init({ lat: 0, lng: 0 });

 mapWrapperUI.reset();
 mapWrapperUI.bindGuess((point) => {
  gameFlow.finishGuess(point);
 });

 mapWrapperUI.bindGuessButton(guessBtn);

 const tweaks = new Tweaks({
  mapElement: mapEl,
  streetElement: streetEl,
  root: screensEl
 });

 tweaks.apply();

 await gameFlow.startGame();

 console.log("INIT OK");
}

init();
