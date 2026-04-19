import { Game } from "./core/Game.js";
import { GameState } from "./core/GameState.js";
import { GameFlow } from "./core/GameFlow.js";
import { Bridge } from "./core/Bridge.js";
import { ViewModelBuilder } from "./core/ViewModelBuilder.js";
import { Geometry } from "./domain/Geometry.js";
import { Scoring } from "./domain/Scoring.js";
import { AreaRegistry } from "./domain/AreaRegistry.js";
import { MapAdapter } from "./adapters/MapAdapter.js";
import { LocationGenerator } from "./adapters/LocationGenerator.js";
import { MapUI } from "./ui/MapUI.js";
import { StreetViewUI } from "./ui/StreetViewUI.js";
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

// BOOTSTRAP

async function bootstrap() {
 try {
  console.log("[Init] START");
  await waitForGoogle();
  tweaks();
  const config = loadConfig();
  const area = AreaRegistry.get(config.area);
  const root = document.querySelector(".game");
  const geometry = new Geometry();
  const scoring = new Scoring(geometry);
  const mapAdapter = new MapAdapter(window.google);
  const generator = new LocationGenerator({ mapAdapter, geometry });
  const game = new Game({
   gameState: new GameState(),
   scoring
  });
  const gameFlow = new GameFlow({ game, generator, area });
  const mapUI = new MapUI({
   adapter: mapAdapter,
   mapElement: root.querySelector(".map"),
   overviewElement: root.querySelector(".overview-map")
  });
  const streetViewUI = new StreetViewUI({
   element: root.querySelector(".streetview"),
   adapter: mapAdapter
  });
  const staticUI = new StaticUI({ element: root });
  const bridge = new Bridge({
    game, gameFlow, mapUI, streetViewUI, staticUI,
    viewModelBuilder: new ViewModelBuilder()
  });
  
  mapUI.init();
  streetViewUI.init();
  await gameFlow.startGame();
  bridge.sync();

  console.log("[Init] SUCCESS");
 } catch (err) { console.error("[Init] FAILED:", err); }
}

bootstrap();
