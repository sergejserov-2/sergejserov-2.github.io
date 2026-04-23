import { Game } from "../../core/Game.js";
import { GameState } from "../../core/GameState.js";
import { GameFlow } from "../../core/GameFlow.js";

import { Scoring } from "../../domain/Scoring.js";
import { Difficulty } from "../../domain/math/Difficulty.js";
import { LocationGenerator } from "../../domain/LocationGenerator.js";
import { AreaRegistry } from "../../domain/AreaRegistry.js";

import { StreetViewAdapter } from "../../adapters/StreetViewAdapter.js";
import { MapAdapter } from "../../adapters/MapAdapter.js";

import { TimerService } from "../../services/TimerService.js";
import { MovesService } from "../../services/MovesService.js";

import { StreetViewUI } from "../../ui/components/StreetViewUI.js";
import { MapWrapperUI } from "../../ui/components/MapWrapperUI.js";
import { MapOverviewUI } from "../../ui/components/MapOverviewUI.js";
import { StaticUI } from "../../ui/components/StaticUI.js";

import { ScreenManager } from "../../ui/ScreenManager.js";
import { UIFlow } from "../../ui/UIFlow.js";
import { UIBuilder } from "../../ui/UIBuilder.js";
import { Tweaks } from "../../ui/Tweaks.js";

export function buildGameApp({ config, mode, room }) {

 console.log("GAME BOOTSTRAP");

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
  moves: new MovesService()
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

 const generator = new LocationGenerator({ streetAdapter });

 const gameFlow = new GameFlow({
  game,
  generator,
  area,
  services,
  mode,
  network: room || null
 });

 // =========================
 // UI ROOT
 // =========================
 const hud = document.querySelector(".hud");
 const mapEl = document.querySelector(".map");
 const streetEl = document.querySelector(".streetview");
 const screensEl = document.querySelector(".screens");

 const guessBtn = document.querySelector("#makeGuess");
 const polygonBtn = document.querySelector(".polygon-button");

 // =========================
 // UI BUILDER
 // =========================
 const uiBuilder = new UIBuilder();
 uiBuilder.setConfig(config);

 // =========================
 // MAIN UI
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
  uiBuilder
 });

 const screenManager = new ScreenManager({
  root: screensEl
 });

 // =========================
 // OVERVIEW UI (FIX — ВАЖНО)
 // =========================
 const roundOverviewUI = new MapOverviewUI({
  adapter: mapAdapter,
  element: document.querySelector(".round-result .overview-map"),
  uiBuilder
 });

 const gameOverviewUI = new MapOverviewUI({
  adapter: mapAdapter,
  element: document.querySelector(".game-result .overview-map"),
  uiBuilder
 });

 roundOverviewUI.init();
 gameOverviewUI.init();

 // =========================
 // FLOW
 // =========================
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

 // =========================
 // STREET VIEW
 // =========================
 streetViewUI.onReady = () => gameFlow.streetViewReady();

 streetViewUI.init({ lat: 0, lng: 0 });

 streetViewUI.onMove = () => gameFlow.registerMove();

 // =========================
 // MAP
 // =========================
 mapWrapperUI.init();
 mapWrapperUI.reset();
 mapWrapperUI.setArea(area);
 mapWrapperUI.bindPolygonButton(polygonBtn);

 mapWrapperUI.bindGuess((point) => {
  gameFlow.finishGuess(point);
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
 // START
 // =========================
gameFlow.startGame();

 return gameFlow;
}
