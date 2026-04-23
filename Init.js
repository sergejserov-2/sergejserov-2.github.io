// init.js

import { getConfig } from "./config/getConfig.js";
import { createSoloApp } from "./bootstrap/createSoloApp.js";
import { createDuelApp } from "./bootstrap/createDuelApp.js";

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

 // =========================
 // BOOT CONTEXT (DUEL vs SOLO)
 // =========================
 const boot = window.__GAME_BOOT || null;

 const config = getConfig();

const mode = roomId ? "duel" : (boot?.mode || config.mode);
 const roomId = boot?.roomId || null;

 // =========================
 // ROUTING
 // =========================
 if (mode === "duel") {
  await createDuelApp({
   ...config,
   roomId
  });
 } else {
  await createSoloApp(config);
 }

 console.log("INIT OK");
}

init();
