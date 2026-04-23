import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

export async function createDuelApp(config) {
 console.log("DUEL MODE START");

 const roomController = new FirebaseRoomController();

 let room;

 // =========================
 // CREATE OR JOIN
 // =========================
 if (config.roomId) {
  console.log("JOIN ROOM:", config.roomId);

  await roomController.joinRoom(config.roomId);

 } else {
  room = await roomController.createRoom(config);

  console.log("ROOM CREATED:", room.roomId);
  console.log("INVITE LINK:", room.inviteLink);

  setupLobby(roomController, room);
  return;
 }

 // =========================
 // WAIT FOR START (FSM SAFE)
 // =========================
 await waitForStart(roomController);

 // =========================
 // START GAME
 // =========================
 return buildGameApp({
  config,
  mode: "duel",
  room: roomController
 });
}

// =========================
// SAFE START WAITER
// =========================
function waitForStart(roomController) {
 return new Promise(resolve => {
  roomController.onStart(() => resolve());
 });
}

// =========================
// LOBBY HOOK (UI LATER)
// =========================
function setupLobby(roomController, room) {
 console.log("LOBBY READY:", room.roomId);

 // UI layer will:
 // - show invite link
 // - show live config
 // - enable start when guestReady
}
