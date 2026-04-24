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

export function buildGameApp({ config, mode, room, role }) {

 console.log("🔥 GAME BOOTSTRAP START");
 console.log("🧠 MODE:", mode);
 console.log("🧠 ROLE:", role);
 console.log("🧠 CONFIG:", config);

 // =========================
 // DOMAIN
 // =========================
 console.log("➡️ DOMAIN START");

 const area = AreaRegistry.get(config.area || "europe");
 console.log("🗺️ AREA:", area);

 const difficulty = new Difficulty();
 const scoring = new Scoring({ difficulty });

 console.log("➡️ DOMAIN OK");

 // =========================
 // SERVICES
 // =========================
 console.log("➡️ SERVICES START");

 const services = {
  timer: new TimerService(),
  moves: new MovesService()
 };

 console.log("➡️ SERVICES OK");

 // =========================
 // ADAPTERS
 // =========================
 console.log("➡️ ADAPTERS START");

 const streetAdapter = new StreetViewAdapter();
 const mapAdapter = new MapAdapter();

 console.log("➡️ ADAPTERS OK");

 // =========================
 // CORE
 // =========================
 console.log("➡️ CORE START");

 const gameState = new GameState();

 const playerId =
  mode === "duel"
   ? (role === "guest" ? "p2" : "p1")
   : "p1";

 console.log("👤 PLAYER ID:", playerId);

 const game = new Game({
  gameState,
  scoring,
  players: mode === "duel" ? ["p1", "p2"] : ["p1"],
  config
 });

 const generator = new LocationGenerator({ streetAdapter });

 const gameFlow = new GameFlow({
  game,
  generator,
  area,
  services,
  mode,
  network: room || null,
  playerId
 });

 console.log("🚀 GAMEFLOW CREATED");

 // =========================
 // UI ROOT
 // =========================
 console.log("➡️ UI START");

 const hud = document.querySelector(".hud");
 const mapEl = document.querySelector(".map");
 const streetEl = document.querySelector(".streetview");
 const screensEl = document.querySelector(".screens");

 console.log("🧪 DOM CHECK:", {
  hud: !!hud,
  map: !!mapEl,
  street: !!streetEl,
  screens: !!screensEl
 });

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

 console.log("➡️ UI COMPONENTS CREATED");

 // =========================
 // OVERVIEW UI
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

 console.log("➡️ OVERVIEW UI OK");

 // =========================
 // FLOW
 // =========================
 console.log("➡️ UIFLOW START");

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

 console.log("➡️ UIFLOW OK");

 // =========================
 // STREET VIEW
 // =========================
 console.log("➡️ STREET VIEW INIT");

 streetViewUI.onReady = () => {
  console.log("📍 STREET READY");
  gameFlow.streetViewReady();
};

 streetViewUI.init({ lat: 0, lng: 0 });

 streetViewUI.onMove = () => gameFlow.registerMove();

 console.log("➡️ STREET VIEW OK");

 // =========================
 // MAP
 // =========================
 console.log("➡️ MAP INIT");

 mapWrapperUI.init();
 mapWrapperUI.reset();
 mapWrapperUI.setArea(area);
 mapWrapperUI.bindPolygonButton(polygonBtn);
 mapWrapperUI.bindGuess((point) => {
  console.log("📍 GUESS");
  gameFlow.finishGuess(point);
 });

 mapWrapperUI.bindGuessButton(guessBtn);

 console.log("➡️ MAP OK");

 // =========================
 // TWEAKS
 // =========================
 const tweaks = new Tweaks({
  mapElement: mapEl,
  streetElement: streetEl,
  root: screensEl
 });

 tweaks.apply();

 console.log("➡️ TWEAKS OK");

 // =========================
 // START
 // =========================
 console.log("➡️ START SECTION");

  gameFlow.startGame();

 console.log("🔥 BUILD GAME APP DONE");

 return gameFlow;
}
