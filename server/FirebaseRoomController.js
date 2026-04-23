import {
 ref,
 set,
 update,
 onValue,
 push,
 get
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

export class FirebaseRoomController {
 constructor() {
  this.db = db;

  this.roomId = null;
  this.roomRef = null;

  this.listeners = {
   guestReady: [],
   start: [],
   config: [],
   state: [],
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

  const state = {
   roomId: this.roomId,

   // FSM STATE
   state: "LOBBY",

   // LOBBY CONFIG
   draftConfig: initialConfig,

   // FINAL CONFIG (only after START)
   config: null,

   guestReady: false,

   players: {
    host: "p1",
    guest: null
   },

   createdAt: Date.now()
  };

  await set(this.roomRef, state);

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

  this.bind();

  const snap = await get(this.roomRef);
  const state = snap.val();

  await this.registerGuest();

  return state;
 }

 // =========================
 // REGISTER GUEST
 // =========================
 async registerGuest() {
  if (!this.roomRef) return;

  const snap = await get(this.roomRef);
  const state = snap.val();

  if (!state) return;
  if (state.players?.guest) return;

  await update(this.roomRef, {
   "players/guest": "p2"
  });
 }

 // =========================
 // FSM LISTENER
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const state = snap.val();
   if (!state) return;

   // full state
   this.listeners.state.forEach(cb => cb(state));

   // draft config (LOBBY ONLY)
   if (state.draftConfig) {
    this.listeners.draftConfig.forEach(cb => cb(state.draftConfig));
   }

   // final config (STARTED ONLY)
   if (state.config) {
    this.listeners.config.forEach(cb => cb(state.config));
   }

   // READY SIGNAL
   if (state.guestReady) {
    this.listeners.guestReady.forEach(cb => cb(state));
   }

   // FSM START GATE (ВАЖНО)
   if (state.state === "STARTED") {
    this.listeners.start.forEach(cb => cb(state));
   }
  });
 }

 // =========================
 // LIVE CONFIG UPDATE
 // =========================
 async setDraftConfig(partialConfig) {
  if (!this.roomRef) return;

  await update(this.roomRef, {
   draftConfig: partialConfig
  });
 }

 // =========================
 // READY
 // =========================
 async setGuestReady() {
  if (!this.roomRef) return;

  await update(this.roomRef, {
   guestReady: true,
   state: "READY"
  });
 }

 // =========================
 // START GAME (FSM)
 // =========================
 async lockConfigAndStart() {
  const snap = await get(this.roomRef);
  const state = snap.val();

  if (!state?.guestReady) return;

  // 🔥 LOCK STEP
  await update(this.roomRef, {
   state: "LOCKING"
  });

  // commit config
  await update(this.roomRef, {
   config: state.draftConfig,
   state: "STARTED",
   startedAt: Date.now()
  });
 }

 // =========================
 // EVENTS
 // =========================
 onGuestReady(cb) {
  this.listeners.guestReady.push(cb);
 }

 onStart(cb) {
  this.listeners.start.push(cb);
 }

 onConfig(cb) {
  this.listeners.config.push(cb);
 }

 onDraftConfig(cb) {
  this.listeners.draftConfig.push(cb);
 }

 onState(cb) {
  this.listeners.state.push(cb);
 }
}
