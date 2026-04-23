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
 console.log("🟢 [DUEL] ENTER");

 const roomController = new FirebaseRoomController();
 const role = getRole();
 const roomId = getRoomId(config);

 let room;

 if (roomId) {
  console.log("🟡 JOIN ROOM", roomId);

  room = await roomController.joinRoom(roomId);

  if (role === "guest") {
   console.log("🟡 GUEST READY");
   await roomController.setGuestReady();
  }

 } else {
  room = await roomController.createRoom(config);
  console.log("🟢 CREATED ROOM", room.roomId);
 }

 console.log("🟡 WAIT START");

 const gameConfig = await waitForStart(roomController);

 console.log("🟢 START RECEIVED");

 return buildGameApp({
  config: gameConfig,
  mode: "duel",
  room: roomController,
  role
 });
}

function waitForStart(roomController) {
 return new Promise(resolve => {
  roomController.onStart((payload) => {
   console.log("🔥 GAME START EVENT");
   resolve(payload.config);
  });
 });
}
