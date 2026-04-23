import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

export async function createDuelApp(config) {
 console.log("DUEL MODE START");

 const roomController = new FirebaseRoomController();

 let roomId;

 // =========================
 // CREATE OR JOIN
 // =========================
 if (config.roomId) {
  console.log("JOIN ROOM:", config.roomId);

  roomId = config.roomId;
  await roomController.joinRoom(roomId);

 } else {
  const room = await roomController.createRoom(config);

  roomId = room.roomId;

  console.log("ROOM CREATED:", room.roomId);
  console.log("INVITE LINK:", room.inviteLink);

  setupLobby(roomController, room);

  // ❌ больше НЕТ waitForStart
  // UI сам слушает onStart
 }

 // =========================
 // BUILD GAME IMMEDIATELY
 // =========================
 const game = buildGameApp({
  config,
  mode: "duel",
  room: roomController
 });

 // =========================
 // BOOTSTRAP CONTROL BRIDGE
 // =========================
 roomController.onStart((payload) => {
  console.log("🔥 GAME START EVENT RECEIVED");

  game.flow.startGameFromNetwork?.(payload);
 });

 return game;
}

// =========================
// LOBBY HOOK
// =========================
function setupLobby(roomController, room) {
 console.log("LOBBY READY:", room.roomId);
}
