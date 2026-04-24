import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

export async function createDuelApp(config) {
 console.log("🟢 [DUEL] INIT");

 const url = new URL(window.location.href);
 const roomId = url.searchParams.get("room");
 const role = url.searchParams.get("role");

 console.log("🟡 ROLE:", role);
 console.log("🟡 ROOM:", roomId);

 const room = new FirebaseRoomController();
 await room.joinRoom(roomId);

 console.log("🟢 ROOM JOINED");

 // =========================
 // BUILD GAME (НО НЕ СТАРТУЕМ)
 // =========================
 const gameFlow = buildGameApp({
  config,
  mode: "duel",
  room,
  role
 });

 console.log("🟢 GAME APP BUILT");

 // =========================
 // STATE-DRIVEN START
 // =========================
 room.onPlayers((players) => {
  console.log("👥 PLAYERS UPDATE", players);

  if (players?.host?.ready && players?.guest?.ready) {
   console.log("🔥 BOTH READY → START");

   gameFlow.start({ role });
  }
 });

 return gameFlow;
}
