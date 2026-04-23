// bootstrap/createDuelApp.js

import { FirebaseRoomController } from "../server/FirebaseRoomController.js";

export async function createDuelApp(config) {
 console.log("DUEL MODE START");

 const roomController = new FirebaseRoomController();

 if (config.roomId) {
  console.log("JOIN ROOM:", config.roomId);

  await roomController.joinRoom(config.roomId);
 } else {
  const room = await roomController.createRoom();

  console.log("ROOM CREATED:", room.roomId);
  console.log("INVITE LINK:", room.inviteLink);

  // дальше UI лобби (следующий шаг)
 }

 roomController.on("gameStarted", () => {
  console.log("GAME STARTED FROM ROOM");
  // здесь позже подключим GameFlow (как в solo)
 });
}
