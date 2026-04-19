import { Game } from "./core/Game.js";
import { GameState } from "./core/GameState.js";
import { Bridge } from "./core/Bridge.js";
import { ViewModelBuilder } from "./core/ViewModelBuilder.js";

import { Geometry } from "./domain/Geometry.js";
import { Scoring } from "./domain/Scoring.js";
import { AreaRegistry } from "./domain/AreaRegistry.js";

import { MapAdapter } from "./adapters/MapAdapter.js";
import { LocationGenerator } from "./adapters/LocationGenerator.js";

import { MapUI } from "./ui/MapUI.js";
import { StreetViewUI } from "./ui/StreetviewUI.js";
import { StaticUI } from "./ui/StaticUI.js";
import { tweaks } from "./ui/Tweaks.js";

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

async function bootstrap() {
 try {
  console.log("[Init] START");

  await waitForGoogle();

  tweaks();

  const config = loadConfig();
  const area = AreaRegistry[config.area];

  const root = document.querySelector(".game");

  /* =========================
     DOMAIN
  ========================= */
  const geometry = new Geometry();
  const scoring = new Scoring(geometry);

  /* =========================
     ADAPTERS
  ========================= */
  const mapAdapter = new MapAdapter(window.google);

  const generator = new LocationGenerator({
   mapAdapter,
   geometry
  });

  /* =========================
     CORE
  ========================= */
  const game = new Game({
   gameState: new GameState(),
   generator,
   scoring
  });

  /* =========================
     UI
  ========================= */
  const mapUI = new MapUI({
   adapter: mapAdapter,
   mapElement: root.querySelector(".map"),
   overviewElement: root.querySelector(".overview-map")
  });

  const streetViewUI = new StreetViewUI({
   element: root.querySelector(".streetview")
  });

  const staticUI = new StaticUI({ element: root });

  mapUI.init();
  streetViewUI.init();

  /* =========================
     BRIDGE
  ========================= */
  new Bridge({
   game,
   mapUI,
   streetViewUI,
   staticUI,
   viewModelBuilder: new ViewModelBuilder()
  });

  /* =========================
     START
  ========================= */
  game.startGame();

  console.log("[Init] SUCCESS");

 } catch (err) {
  console.error("[Init] FAILED:", err);
 }
}

bootstrap();
