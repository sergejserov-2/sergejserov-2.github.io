import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

export async function createDuelApp(config) {

 const params = new URLSearchParams(window.location.search);
 const role = params.get("role") || "host";
 const roomId = params.get("room");

 const room = new FirebaseRoomController();
 const snapshot = await room.joinRoom(roomId);

 const gameConfig = await waitForStart(room, snapshot);

 return buildGameApp({
  config: gameConfig || config,
  mode: "duel",
  room,
  role
 });
console.log("calling start");
 app.startGameFromNetwork();
}

function waitForStart(room, snapshot) {
 return new Promise(resolve => {

  if (snapshot?.game?.started) {
   resolve(snapshot.game.config);
   return;
  }

  room.onPlayers((players) => {
   if (players?.game?.started) {
    resolve(players.game.config);
   }
  });

 });
}
