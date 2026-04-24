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
 // GUARD
 // =========================
 let started = false;

 // =========================
 // SINGLE SOURCE OF TRUTH
 // =========================
 room.onRoom((state) => {
  if (!state) return;

  const game = state.game;
  if (!game) return;

  console.log("📡 ROOM STATE UPDATE", state);

  // =========================
  // GAME START
  // =========================
  if (game.started && !started) {
   started = true;

   console.log("🔥 DUEL START TRIGGERED");

   // ⚠️ ВАЖНО:
   // одинаково для host и guest
   gameFlow.startGameFromNetwork?.();
  }

  // =========================
  // ROUND SYNC
  // =========================
  if (game.round) {
   // безопасный контракт: GameFlow сам решает host/guest
   gameFlow.startRoundFromNetwork?.(game.round);
  }
 });

 return gameFlow;
}
