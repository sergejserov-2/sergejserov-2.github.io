// server/FirebaseRoomController.js

import { FirebaseTransport } from "./FirebaseTransport.js";

export class FirebaseRoomController {
 constructor() {
  this.transport = new FirebaseTransport();

  this.roomId = null;
  this.playerId = null;

  this.isHost = false;

  this.listeners = {
   roomUpdated: [],
   opponentJoined: [],
   gameStarted: []
  };
 }

 // =========================
 // EVENTS
 // =========================
 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================
 // CREATE ROOM (HOST)
 // =========================
 async createRoom() {
  this.isHost = true;

  const roomId = this._generateRoomId();
  const playerId = "host";

  this.roomId = roomId;
  this.playerId = playerId;

  await this.transport.createRoom(roomId, {
   status: "waiting",
   host: playerId,
   players: {
    host: true
   }
  });

  this.transport.subscribeRoom(roomId, (data) => {
   this._handleRoomUpdate(data);
  });

  return {
   roomId,
   inviteLink: ${window.location.origin}?room=${roomId}
  };
 }

 // =========================
 // JOIN ROOM (GUEST)
 // =========================
 async joinRoom(roomId) {
  this.isHost = false;

  this.roomId = roomId;
  this.playerId = this._generatePlayerId();

  await this.transport.updateRoom(roomId, {
   [players.${this.playerId}]: true
  });

  this.transport.subscribeRoom(roomId, (data) => {
   this._handleRoomUpdate(data);
  });

  return {
   roomId,
   playerId: this.playerId
  };
 }

 // =========================
 // START GAME (ONLY HOST)
 // =========================
 async startGame() {
  if (!this.isHost || !this.roomId) return;

  await this.transport.updateRoom(this.roomId, {
   status: "started"
  });
 }

 // =========================
 // ROOM LISTENER
 // =========================
 _handleRoomUpdate(data) {
  if (!data) return;

  this.emit("roomUpdated", data);

  // игрок присоединился
  if (data.players && Object.keys(data.players).length > 1) {
   this.emit("opponentJoined", data.players);
  }

  // старт игры
  if (data.status === "started") {
   this.emit("gameStarted", data);
  }
 }

 // =========================
 // UTILS
 // =========================
 _generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
 }

 _generatePlayerId() {
  return "p_" + Math.random().toString(36).substring(2, 8);
 }
}
