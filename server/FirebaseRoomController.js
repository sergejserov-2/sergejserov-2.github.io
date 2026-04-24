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

  // =========================
  // SINGLE SOURCE LISTENER
  // =========================
  this.listeners = {
   room: []
  };
 }

 // =========================
 // CREATE ROOM
 // =========================
 async createRoom(initialConfig = {}) {
  const roomsRef = ref(this.db, "rooms");
  const newRoom = push(roomsRef);

  this.roomId = newRoom.key;
  this.roomRef = ref(this.db, `rooms/${this.roomId}`);

  await set(this.roomRef, {
   roomId: this.roomId,

   players: {
    host: {
     connected: true,
     ready: false
    },
    guest: {
     connected: false,
     ready: false
    }
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
 // JOIN ROOM
 // =========================
 async joinRoom(roomId) {
  this.roomId = roomId;
  this.roomRef = ref(this.db, `rooms/${roomId}`);

  const snap = await get(this.roomRef);
  const room = snap.val();

  if (!room) throw new Error("Room not found");

  // mark guest connected
  await update(this.roomRef, {
   "players/guest/connected": true
  });

  this.bind();

  return room;
 }

 // =========================
 // STATE SUBSCRIPTION
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const room = snap.val();
   if (!room) return;

   this.listeners.room.forEach(cb => cb(room));
  });
 }

 // =========================
 // LISTEN API
 // =========================
 onRoom(cb) {
  this.listeners.room.push(cb);
 }

 // =========================
 // DRAFT CONFIG
 // =========================
 setDraftConfig(cfg) {
  return update(this.roomRef, {
   draftConfig: cfg
  });
 }

 // =========================
 // PLAYER READY
 // =========================
 setGuestReady() {
  return update(this.roomRef, {
   "players/guest/ready": true
  });
 }

 // =========================
 // GAME CONTROL
 // =========================
 startGame(config) {
  const flat = {
   "game/started": true,
   "game/config": config,
   "game/round": null
  };

  return update(this.roomRef, flat);
 }

 // =========================
 // ROUND CONTROL
 // =========================
 setRound(round) {
  const flat = {
   "game/round": round
  };

  return update(this.roomRef, flat);
 }

 clearRound() {
  return update(this.roomRef, {
   "game/round": null
  });
 }

 // =========================
 // SAFE GAME PATCH (IMPORTANT)
 // =========================
 updateGame(patch) {
  const flat = {};

  for (const key in patch) {
   flat[`game/${key}`] = patch[key];
  }

  return update(this.roomRef, flat);
 }

 // =========================
 // PLAYER PATCH HELPERS
 // =========================
 updatePlayer(playerId, patch) {
  const flat = {};

  for (const key in patch) {
   flat[`players/${playerId}/${key}`] = patch[key];
  }

  return update(this.roomRef, flat);
 }

 // =========================
 // RAW ACCESS
 // =========================
 async getRoom() {
  const snap = await get(this.roomRef);
  return snap.val();
 }
}
