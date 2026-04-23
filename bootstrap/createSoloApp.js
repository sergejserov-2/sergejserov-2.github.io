export async function createSoloApp(config) {
 console.log("SOLO MODE START");

 const { buildGameApp } = await import("./shared/buildGameApp.js");

 buildGameApp({
  config,
  mode: "solo",
  room: null
 });
}
