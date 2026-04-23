import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

export async function createDuelApp(config) {
 console.log("DUEL MODE START");

 const roomController = new FirebaseRoomController();

 let roomId = config.roomId || null;

 // =========================
 // CREATE OR JOIN
 // =========================
 if (!roomId) {
  const room = await roomController.createRoom(config);

  console.log("ROOM CREATED:", room.roomId);
  console.log("INVITE LINK:", room.inviteLink);

  setupLobby(roomController, room);

  return;
 }

 console.log("JOIN ROOM:", roomId);

 const initialState = await roomController.joinRoom(roomId);

 // =========================
 // WAIT FOR FSM START
 // =========================
 await waitForGameStart(roomController);

 // =========================
 // GET FINAL STATE
 // =========================
 const finalState = await roomController.getFinalState?.() 
  || initialState;

 // =========================
 // START GAME
 // =========================
 return buildGameApp({
  config: finalState.config, // 🔥 ВАЖНО: только LOCKED config
  mode: "duel",
  room: roomController
 });
}

// =========================
// FSM SAFE WAITER
// =========================
function waitForGameStart(roomController) {
 return new Promise(resolve => {
  roomController.onState((state) => {
   if (state.state === "STARTED" && state.config) {
    resolve(state);
   }
  });
 });
}

// =========================
// LOBBY HOOK
// =========================
function setupLobby(roomController, room) {
 console.log("LOBBY READY:", room.roomId);

 // UI:
 // - invite link
 // - live draft config
 // - guestReady / start button enable
}
