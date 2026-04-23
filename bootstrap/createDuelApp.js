import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

function getRole() {
 const params = new URLSearchParams(window.location.search);
 return (params.get("role") || "host").trim().toLowerCase();
}

function getRoomId(config) {
 return config.roomId || new URLSearchParams(window.location.search).get("room");
}

export async function createDuelApp(config) {

 console.log("🟢 [DUEL] ENTER");
 console.log("🟢 [DUEL] CONFIG:", config);

 const roomController = new FirebaseRoomController();

 const role = getRole();
 const roomId = getRoomId(config);

 console.log("🟡 ROLE:", role);
 console.log("🟡 ROOM:", roomId);

 let roomSnapshot;

 // =========================
 // JOIN OR CREATE
 // =========================
 if (roomId) {

  console.log("🟡 JOIN FLOW");

  roomSnapshot = await roomController.joinRoom(roomId);

  console.log("🟢 JOINED ROOM:", roomSnapshot);

  // 💥 IMPORTANT: SNAPSHOT CHECK (FIX RACE CONDITION)
  if (roomSnapshot?.players?.game?.started) {

   console.log("🔥 GAME ALREADY STARTED (SNAPSHOT) → REDIRECT");

   window.location.href =
    /play.html?room=${roomId}&role=${role};

   return;
  }

  // guest auto-ready
  if (role === "guest") {
   console.log("🟡 GUEST → setGuestReady()");
   await roomController.setGuestReady();
   console.log("🟢 GUEST READY SENT");
  }

 } else {

  console.log("🟡 CREATE FLOW");

  const room = await roomController.createRoom(config);

  console.log("🟢 ROOM CREATED:", room.roomId);
  console.log("🟢 INVITE:", room.inviteLink);

  return;
 }

 // =========================
 // START LISTENER
 // =========================
 console.log("🟡 WAITING FOR GAME START...");

 let started = false;

 const startPromise = new Promise(resolve => {

  roomController.onPlayers?.((players) => {

   if (started) return;

   const gameStarted = players?.game?.started;

   if (!gameStarted) return;

   started = true;

   console.log("🔥 GAME START DETECTED (EVENT)");

   resolve(players.game.config);
  });
 });

 const gameConfig = await startPromise;

 console.log("🟢 START RECEIVED");
 console.log("🟢 GAME CONFIG:", gameConfig);

 // =========================
 // BUILD GAME
 // =========================
 console.log("🟡 BUILD GAME APP");

 const app = buildGameApp({
  config: gameConfig || config,
  mode: "duel",
  room: roomController,
  role
 });

 console.log("🟢 GAME APP READY");

 return app;
}
