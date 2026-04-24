import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

export async function createDuelApp(config) {
 console.log("🟢 [DUEL] INIT");

 const url = new URL(window.location.href);
 const roomId = url.searchParams.get("room");
 const role = url.searchParams.get("role");

 console.log("🟡 ROLE:", role);
 console.log("🟡 ROOM:", roomId);

 // =========================
 // CONNECT ROOM
 // =========================
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

 // =========================
 // STATE FLAG
 // =========================
 let startedOnce = false;

 // =========================
 // SINGLE SOURCE OF TRUTH
 // =========================
 room.onRoom((state) => {

  console.log("📡 ROOM STATE UPDATE", state);

  const game = state.game;

  if (!game) return;

  // =========================
  // START CONDITION
  // =========================
  if (game.started && !startedOnce) {
   startedOnce = true;

   console.log("🔥 DUEL START TRIGGERED");

   if (role === "host") {
    gameFlow.startGame();
   }

   if (role === "guest") {
    gameFlow.startGameFromNetwork?.();
   }
  }
 });

 return gameFlow;
}
