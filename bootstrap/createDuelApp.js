import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

function getRole() {
 const params = new URLSearchParams(window.location.search);
 return params.get("role") || "host";
}

function getRoomId(config) {
 return config.roomId || new URLSearchParams(window.location.search).get("room");
}

export async function createDuelApp(config) {
 console.log("DUEL MODE START");

 const roomController = new FirebaseRoomController();
 const role = getRole();

 const roomId = getRoomId(config);

 // =========================
 // HOST / GUEST SETUP
 // =========================
 let room;

 if (roomId) {
  console.log("JOIN ROOM:", roomId);

  room = await roomController.joinRoom(roomId);

  if (role === "guest") {
   console.log("GUEST READY SIGNAL");
   await roomController.setGuestReady();
  }

 } else {
  console.log("CREATE ROOM");

  room = await roomController.createRoom(config);

  console.log("ROOM CREATED:", room.roomId);
  console.log("INVITE LINK:", room.inviteLink);
 }

 // =========================
 // WAIT FOR GAME START (UNIFIED GATE)
 // =========================
 const gameConfig = await waitForStart(roomController);

 console.log("🔥 DUEL START CONFIRMED");

 // =========================
 // BUILD GAME APP
 // =========================
 return buildGameApp({
  config: gameConfig || config,
  mode: "duel",
  room: roomController,
  role
 });
}

// =========================
// START GATE (STATE-BASED, NO RACE CONDITIONS)
// =========================
function waitForStart(roomController) {
 return new Promise(resolve => {

  const unsub = roomController.onStart((payload) => {
   console.log("🔥 GAME_STARTED RECEIVED");
   unsub?.(); // prevent duplicate triggers
   resolve(payload?.config);
  });

 });
}
