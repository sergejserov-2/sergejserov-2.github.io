import {
 ref,
 set,
 onValue,
 push,
 get,
 update
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

export class FirebaseRoomController {
 constructor() {
  this.db = db;

  this.roomId = null;
  this.roomRef = null;

  // SINGLE STREAM
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

   draftConfig: initialConfig,

   game: {
    started: false,
    config: null,
    round: null
   }
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
 // STREAM
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
 // CONFIG
 // =========================
 setDraftConfig(cfg) {
  return update(this.roomRef, {
   draftConfig: cfg
  });
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
 // GAME START
 // =========================
 startGame(config) {
  return update(this.roomRef, {
   "game/started": true,
   "game/config": config,
   "game/round": null
  });
 }

 // =========================
 // ROUND STATE (KEY PART)
 // =========================
 setRound(round) {
  return update(this.roomRef, {
   "game/round": {
    index: round.index,
    location: round.location,
    status: "running"
   }
  });
 }

 finishRound() {
  return update(this.roomRef, {
   "game/round/status": "finished"
  });
 }

 // =========================
 // PLAYER PATCH
 // =========================
 updatePlayer(playerId, patch) {
  const flat = {};
  for (const k in patch) {
   flat[`players/${playerId}/${k}`] = patch[k];
  }
  return update(this.roomRef, flat);
 }

 // =========================
 // RAW
 // =========================
 async getRoom() {
  const snap = await get(this.roomRef);
  return snap.val();
 }
}
