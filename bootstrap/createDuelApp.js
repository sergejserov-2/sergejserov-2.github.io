import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

function getRole() {
 const params = new URLSearchParams(window.location.search);
 return params.get("role") || "host";
}

function getRoomId(config) {
 return config.roomId || new URLSearchParams(window.location.search).get("room");
}

// =========================
// MAIN ENTRY
// =========================
export async function createDuelApp(config) {
 console.log("🟢 [DUEL] ENTER");

 const roomController = new FirebaseRoomController();
 const role = getRole();
 const roomId = getRoomId(config);

 console.log("🟡 ROLE:", role);
 console.log("🟡 ROOM:", roomId);

 let room;

 // =========================
 // JOIN OR CREATE
 // =========================
 if (roomId) {
  console.log("🟡 JOIN FLOW");

  room = await roomController.joinRoom(roomId);

  console.log("🟢 JOINED ROOM:", room);

  if (role === "guest") {
   console.log("👤 GUEST READY → updating state");
   await roomController.setGuestReady();
  }

 } else {
  console.log("🟡 CREATE FLOW");

  room = await roomController.createRoom(config);

  console.log("🟢 ROOM CREATED:", room.roomId);
  console.log("🔗 INVITE:", room.inviteLink);
 }

 // =========================
 // WAIT FOR GAME START (STATE-BASED)
 // =========================
 const gameConfig = await waitForGameStart(roomController);

 console.log("🟢 GAME START RECEIVED:", gameConfig);

 // =========================
 // BUILD GAME APP
 // =========================
 const app = buildGameApp({
  config: gameConfig,
  mode: "duel",
  room: roomController,
  role
 });

 console.log("🟢 GAME APP READY");

 return app;
}

// =========================
// WAIT START (STATE LISTENER)
// =========================
function waitForGameStart(roomController) {
 return new Promise(resolve => {

  console.log("🟡 WAITING FOR players.guest.ready...");

  const unsub = roomController.onPlayers((players) => {

   const guestReady = players?.guest?.ready;
   const hostReady = players?.host?.connected;

   if (guestReady && hostReady) {
    console.log("🔥 BOTH PLAYERS READY → START GAME");

    unsub?.();

    resolve({
     mode: "duel",
     players: ["p1", "p2"]
    });
   }
  });
 });
}
