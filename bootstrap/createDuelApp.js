import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

export async function createDuelApp(config) {

 console.log("🟢 DUEL INIT");

 const url = new URL(window.location.href);
 const roomId = url.searchParams.get("room");
 const role = url.searchParams.get("role");

 const room = new FirebaseRoomController();
 await room.joinRoom(roomId);

 console.log("🟢 ROOM JOINED");

 const gameFlow = buildGameApp({
  config,
  mode: "duel",
  room,
  role
 });

 let started = false;

 room.onRoom((state) => {

  const game = state.game;

  if (!game) return;

  if (game.started && !started) {
   started = true;

   console.log("🔥 DUEL START");

    gameFlow.startGame();
  }
 });

 return gameFlow;
}
