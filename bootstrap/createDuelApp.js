import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

export async function createDuelApp(config) {
 console.log("DUEL MODE START");

 const roomController = new FirebaseRoomController();

 let room;

 // =========================
 // JOIN OR CREATE
 // =========================
 if (config.roomId) {
  console.log("JOIN ROOM:", config.roomId);

  room = await roomController.joinRoom(config.roomId);

 } else {
  room = await roomController.createRoom();

  console.log("ROOM CREATED:", room.roomId);
  console.log("INVITE LINK:", room.inviteLink);

  // здесь остаётся LOBBY (пока не стартуем игру)
  setupLobby(roomController, room);
  return;
 }

 // =========================
 // WAIT START SIGNAL
 // =========================
 await new Promise(resolve => {
  roomController.onStart(() => resolve());
 });

 // =========================
 // START GAME
 // =========================
 buildGameApp({
  config,
  mode: "duel",
  room: roomController
 });
}
