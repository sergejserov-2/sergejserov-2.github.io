import {
  ref,
  set,
  onValue,
  push,
  get,
  update,
  remove,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

export class FirebaseRoomController {
 constructor() {
  this.db = db;
  this.roomId = null;
  this.roomRef = null;

  this.listeners = {
   room: []
  };
 }

 // =========================
 // CREATE
 // =========================
 async createRoom(initialConfig = {}) {
  const roomsRef = ref(this.db, "rooms");
  const newRoom = push(roomsRef);

  this.roomId = newRoom.key;
  this.roomRef = ref(this.db, `rooms/${this.roomId}`);

  await set(this.roomRef, {
   roomId: this.roomId,
   players: {
    host: { connected: true, ready: false },
    guest: { connected: false, ready: false }
   },
   game: {
    started: false,
    config: null,
    round: null
   },
   draftConfig: initialConfig
  });

  this.bind();

  return {
   roomId: this.roomId,
   inviteLink: `${window.location.origin}/waiting.html?room=${this.roomId}&role=guest`
  };
 }

 // =========================
 // JOIN
 // =========================
 async joinRoom(roomId) {
  this.roomId = roomId;
  this.roomRef = ref(this.db, `rooms/${roomId}`);

  const snap = await get(this.roomRef);
  const room = snap.val();

  if (!room) throw new Error("Room not found");

  await update(this.roomRef, {
   "players/guest/connected": true
  });

  this.bind();

  return room;
 }

 // =========================
 // BIND
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const room = snap.val();
   if (!room) return;

   this.listeners.room.forEach(cb => cb(room));
  });
 }

 onRoom(cb) {
  this.listeners.room.push(cb);
 }

 // =========================
 // READY
 // =========================
 setGuestReady() {
  return update(this.roomRef, {
   "players/guest/ready": true
  });
 }

 // =========================
 // START GAME
 // =========================
 startGame(config) {
  return update(this.roomRef, {
   "game/started": true,
   "game/config": config,
   "game/round": null
  });
 }

 // =========================
 // ROUND SYNC
 // =========================
 setRound(round) {
  return update(this.roomRef, {
   "game/round": round
  });
 }

 updateGuess(playerId, result) {
  return update(this.roomRef, {
   [`game/round/guesses/${playerId}`]: result
  });
 }

 // =========================================================
 // 🚪 LEAVE ROOM (NEW)
 // =========================================================
 async leaveRoom(role = "guest") {
  if (!this.roomRef) return;

  await update(this.roomRef, {
   [`players/${role}/connected`]: false,
   [`players/${role}/ready`]: false
  });

  await this.cleanupIfEmpty();
 }

 // =========================================================
 // 🧹 AUTO CLEANUP ROOM IF EMPTY
 // =========================================================
 async cleanupIfEmpty() {
  const snap = await get(this.roomRef);
  const room = snap.val();

  if (!room) return;

  const players = room.players || {};

  const anyConnected =
   players.host?.connected ||
   players.guest?.connected;

  if (!anyConnected) {
   await remove(this.roomRef);
  }
 }

 // =========================================================
 // ⚡ OPTIONAL: HARD DISCONNECT HANDLING
 // =========================================================
 enableAutoDisconnect(role = "guest") {
  if (!this.roomRef) return;

  const playerRef = ref(
   this.db,
   `rooms/${this.roomId}/players/${role}`
  );

  onDisconnect(playerRef).update({
   connected: false,
   ready: false
  });
 }
}
