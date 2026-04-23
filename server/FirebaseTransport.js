import {
 ref,
 set,
 update,
 onValue,
 push,
 get
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

export class FirebaseTransport {
 constructor() {
  this.db = db;

  this.listeners = new Map();
 }

 // =========================
 // ROOM REF
 // =========================
 roomRef(roomId) {
  return ref(this.db, `rooms/${roomId}`);
 }

 // =========================
 // CREATE ROOM
 // =========================
 async createRoom(initialState) {
  const roomsRef = ref(this.db, "rooms");
  const newRoom = push(roomsRef);

  const roomId = newRoom.key;

  const state = {
   roomId,

   config: null,
   draftConfig: initialState || null,

   players: {
    host: "p1",
    guest: null
   },

   guestReady: false,
   started: false,

   createdAt: Date.now()
  };

  await set(ref(this.db, `rooms/${roomId}`), state);

  return roomId;
 }

 // =========================
 // GET ROOM
 // =========================
 async getRoom(roomId) {
  const snap = await get(this.roomRef(roomId));
  return snap.val();
 }

 // =========================
 // UPDATE ROOM (GENERIC PATCH)
 // =========================
 async updateRoom(roomId, patch) {
  await update(this.roomRef(roomId), patch);
 }

 // =========================
 // DRAFT CONFIG (LIVE LOBBY)
 // =========================
 async setDraftConfig(roomId, draftConfig) {
  await update(this.roomRef(roomId), {
   draftConfig
  });
 }

 // =========================
 // LOCK CONFIG + START GAME
 // =========================
 async startGame(roomId) {
  const snap = await get(this.roomRef(roomId));
  const room = snap.val();

  if (!room) return;

  await update(this.roomRef(roomId), {
   config: room.draftConfig,
   started: true,
   startedAt: Date.now()
  });
 }

 // =========================
 // PLAYER READY
 // =========================
 async setGuestReady(roomId) {
  await update(this.roomRef(roomId), {
   guestReady: true
  });
 }

 // =========================
 // GAME SYNC EVENTS
 // =========================

 pushGuess(roomId, guessPayload) {
  const guessesRef = ref(this.db, `rooms/${roomId}/events/guesses`);
  const id = push(guessesRef).key;

  set(ref(this.db, `rooms/${roomId}/events/guesses/${id}`), {
   ...guessPayload,
   id
  });
 }

 markRoundComplete(roomId, payload) {
  const refPath = ref(this.db, `rooms/${roomId}/events/roundComplete`);

  set(refPath, {
   ...payload,
   ts: Date.now()
  });
 }

 // =========================
 // SUBSCRIBE ROOM
 // =========================
 onRoomUpdate(roomId, cb) {
  const r = this.roomRef(roomId);

  const unsub = onValue(r, (snap) => {
   cb(snap.val());
  });

  this.listeners.set(roomId, unsub);
 }

 // =========================
 // UNSUBSCRIBE
 // =========================
 off(roomId) {
  const fn = this.listeners.get(roomId);
  if (fn) fn();
  this.listeners.delete(roomId);
 }
}
