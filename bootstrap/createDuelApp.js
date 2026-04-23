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
 console.log("🟢 [DUEL] ENTER createDuelApp");
 console.log("🟢 [DUEL] CONFIG:", config);

 const roomController = new FirebaseRoomController();
 const role = getRole();
 const roomId = getRoomId(config);

 console.log("🟡 [DUEL] ROLE:", role);
 console.log("🟡 [DUEL] ROOM_ID:", roomId);

 let room;

 // =========================
 // JOIN OR CREATE
 // =========================
 if (roomId) {
  console.log("🟡 [DUEL] JOIN FLOW");

  room = await roomController.joinRoom(roomId);

  console.log("🟢 [DUEL] JOINED ROOM:", room);

  if (role === "guest") {
   console.log("🟡 [DUEL] GUEST → setGuestReady()");
   await roomController.setGuestReady();
   console.log("🟢 [DUEL] GUEST READY SENT");
  }

 } else {
  console.log("🟡 [DUEL] CREATE FLOW");

  room = await roomController.createRoom(config);

  console.log("🟢 [DUEL] ROOM CREATED:", room.roomId);
  console.log("🟢 [DUEL] INVITE LINK:", room.inviteLink);
 }

 // =========================
 // WAIT START (FIXED)
 // =========================
 console.log("🟡 [DUEL] WAITING FOR START EVENT...");

 const gameConfig = await waitForStart(roomController, config);

 console.log("🟢 [DUEL] START RECEIVED");
 console.log("🟢 [DUEL] GAME CONFIG:", gameConfig);

 // =========================
 // BUILD GAME APP
 // =========================
 console.log("🟡 [DUEL] CALL buildGameApp");

 const app = buildGameApp({
  config: gameConfig,
  mode: "duel",
  room: roomController,
  role
 });

 console.log("🟢 [DUEL] buildGameApp DONE");

 return app;
}

// =========================
// SAFE START GATE (NO UNSUB BUG)
// =========================
function waitForStart(roomController, fallbackConfig) {
 return new Promise(resolve => {

  console.log("🟡 [WAIT] Subscribing to onStart...");

  roomController.onStart((payload) => {
   console.log("🔥 [WAIT] GAME_STARTED EVENT RECEIVED");
   console.log("🔥 [WAIT] PAYLOAD:", payload);

   resolve(payload?.config || fallbackConfig);
  });

 });
}
