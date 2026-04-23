import {
 ref,
 set,
 onValue,
 push,
 get,
 update
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

// =========================
// ROOM CONTROLLER (STATE ONLY)
// =========================
export class FirebaseRoomController {
 constructor() {
  this.db = db;

  this.roomId = null;
  this.roomRef = null;

  // =========================
  // LISTENERS
  // =========================
  this.listeners = {
   players: [],
   draftConfig: []
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

   // =========================
   // STATE TREE
   // =========================
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

   draftConfig: initialConfig
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
 // BIND STATE
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const room = snap.val();
   if (!room) return;

   // =========================
   // PLAYERS STATE
   // =========================
   this.listeners.players.forEach(cb =>
    cb(room.players || {})
   );

   // =========================
   // CONFIG STATE
   // =========================
   this.listeners.draftConfig.forEach(cb =>
    cb(room.draftConfig || {})
   );
  });
 }

 // =========================
 // STATE UPDATES
 // =========================
 setDraftConfig(cfg) {
  return update(this.roomRef, {
   draftConfig: cfg
  });
 }

 setGuestReady() {
  return update(this.roomRef, {
   "players/guest/ready": true
  });
 }

 // =========================
 // LISTENERS
 // =========================
 onPlayers(cb) {
  this.listeners.players.push(cb);
 }

 onDraftConfig(cb) {
  this.listeners.draftConfig.push(cb);
 }
}
