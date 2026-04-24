import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

export async function createDuelApp(config) {
 console.log("🟢 [DUEL] INIT");

 const url = new URL(window.location.href);
 const roomId = url.searchParams.get("room");
 const role = url.searchParams.get("role");

 console.log("🟡 ROLE:", role);
 console.log("🟡 ROOM:", roomId);

 const room = new FirebaseRoomController();
 await room.joinRoom(roomId);

 console.log("🟢 ROOM JOINED");

 // =========================
 // BUILD GAME (NO START)
 // =========================
 const gameFlow = buildGameApp({
  config,
  mode: "duel",
  room,
  role
 });

 console.log("🟢 GAME APP BUILT");

 let startedOnce = false;

 // =========================
 // STATE DRIVER
 // =========================
 room.onRoom((state) => {

  const game = state.game;

  if (!game) return;

  const started = game.started;

  if (started && !startedOnce) {
   startedOnce = true;

   console.log("🔥 GAME STARTED (STATE)");

   gameFlow.startGameFromNetwork?.();
  }
 });

 return gameFlow;
}
