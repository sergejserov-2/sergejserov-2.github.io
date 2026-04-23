export class FirebaseRoomController {
 constructor({ transport }) {
  this.transport = transport;
  this.listeners = {};
  this.roomId = null;
 }

 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 createRoom() {
  const roomId = crypto.randomUUID();

  this.roomId = roomId;

  this.transport.createRoom(roomId);

  this.transport.onRoomUpdate(roomId, (data) => {
   this.handleUpdate(data);
  });

  return roomId;
 }

 joinRoom(roomId) {
  this.roomId = roomId;

  this.transport.joinRoom(roomId);

  this.transport.onRoomUpdate(roomId, (data) => {
   this.handleUpdate(data);
  });
 }

 startGame() {
  this.transport.updateRoom(this.roomId, {
   type: "start"
  });
 }

 handleUpdate(data) {
  if (data.type === "start") {
   this.emit("startGame");
  }

  if (data.type === "playerJoined") {
   this.emit("playerJoined", data);
  }
 }
}
