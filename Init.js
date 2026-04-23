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

 const config = getConfig();

 if (config.mode === "duel") {
  await createDuelApp(config);
 } else {
  await createSoloApp(config);
 }

 console.log("INIT OK");
}

init();
