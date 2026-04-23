// bootstrap/createSoloApp.js

import { Game } from "../core/Game.js";
import { GameState } from "../core/GameState.js";
import { GameFlow } from "../core/GameFlow.js";

import { Scoring } from "../domain/Scoring.js";
import { Difficulty } from "../domain/math/Difficulty.js";
import { LocationGenerator } from "../domain/LocationGenerator.js";
import { AreaRegistry } from "../domain/AreaRegistry.js";

import { MapAdapter } from "../adapters/MapAdapter.js";
import { StreetViewAdapter } from "../adapters/StreetViewAdapter.js";

import { MapWrapperUI } from "../ui/components/MapWrapperUI.js";
import { MapOverviewUI } from "../ui/components/MapOverviewUI.js";
import { StreetViewUI } from "../ui/components/StreetViewUI.js";
import { StaticUI } from "../ui/components/StaticUI.js";

import { ScreenManager } from "../ui/ScreenManager.js";
import { UIFlow } from "../ui/UIFlow.js";
import { UIBuilder } from "../ui/UIBuilder.js";

import { Tweaks } from "../ui/Tweaks.js";

import { TimerService } from "../services/TimerService.js";
import { MovesService } from "../services/MovesService.js";

export async function createSoloApp(config) {
 console.log("SOLO MODE START");

 const hud = document.querySelector(".hud");
 const mapEl = document.querySelector(".map");
 const streetEl = document.querySelector(".streetview");
 const screensEl = document.querySelector(".screens");

 const roundOverviewMapEl = document.querySelector(".round-result .overview-map");
 const gameOverviewMapEl = document.querySelector(".game-result .overview-map");

 const guessBtn = document.querySelector("#makeGuess");
 const polygonBtn = document.querySelector(".polygon-button");

 const area = AreaRegistry.get(config.area || "europe");

 const difficulty = new Difficulty();
 const scoring = new Scoring({ difficulty });

 const services = {
  timer: new TimerService(),
  moves: new MovesService()
 };

 const streetAdapter = new StreetViewAdapter();
 const mapAdapter = new MapAdapter();

 const gameState = new GameState();

 const game = new Game({
  gameState,
  scoring,
  players: ["p1"],
  config
 });

 const generator = new LocationGenerator({ streetAdapter });

 const gameFlow = new GameFlow({
  game,
  generator,
  area,
  services,
  mode: "solo"
 });

 const uiBuilder = new UIBuilder();
 uiBuilder.setConfig(config);

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
  uiBuilder
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

 new UIFlow({
  gameFlow,
  screenManager,
  staticUI,
  uiBuilder,
  streetViewUI,
  mapWrapperUI,
  roundOverviewUI,
  gameOverviewUI
 });

 streetViewUI.onReady = () => gameFlow.streetViewReady();

 gameFlow.on("streetViewSetLocation", (location) => {
  streetViewUI.setLocation(location);
 });

 streetViewUI.init({ lat: 0, lng: 0 });

 streetViewUI.onMove = () => gameFlow.registerMove();

 mapWrapperUI.init();
 mapWrapperUI.reset();
 mapWrapperUI.setArea(area);

 mapWrapperUI.bindPolygonButton(polygonBtn);

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
}
