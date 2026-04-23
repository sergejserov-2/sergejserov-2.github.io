import { FirebaseRoomController } from "../server/FirebaseRoomController.js";
import { buildGameApp } from "./shared/buildGameApp.js";

function getRole() {
 const params = new URLSearchParams(window.location.search);
 return params.get("role") || "host";
}

export async function createDuelApp(config) {
 console.log("DUEL MODE START");

 const roomController = new FirebaseRoomController();
 const role = getRole();

 if (config.roomId) {
  console.log("JOIN ROOM:", config.roomId);

  await roomController.joinRoom(config.roomId);

  if (role === "guest") {
   await roomController.sendGuestJoined();
   await roomController.setGuestReady();
  }

 } else {
  const room = await roomController.createRoom(config);

  console.log("ROOM CREATED:", room.roomId);
  console.log("INVITE LINK:", room.inviteLink);

  return;
 }

 await roomController.waitForStart();

 return buildGameApp({
  config,
  mode: "duel",
  room: roomController,
  role
 });
}


