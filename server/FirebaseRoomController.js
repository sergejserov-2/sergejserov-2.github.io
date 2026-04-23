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
 // CREATE ROOM (HOST)
 // =========================
 async createRoom(initialConfig = {}) {
  const roomsRef = ref(this.db, "rooms");
  const newRoom = push(roomsRef);

  this.roomId = newRoom.key;
  this.roomRef = ref(this.db, `rooms/${this.roomId}`);

  const state = {
   roomId: this.roomId,

   // фиксированный конфиг (только после START)
   config: null,

   // живой конфиг лобби (его крутит хост)
   draftConfig: initialConfig,

   guestReady: false,
   started: false,

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
 // JOIN ROOM (GUEST)
 // =========================
 async joinRoom(roomId) {
 this.roomId = roomId;
 this.roomRef = ref(this.db, `rooms/${roomId}`);

 this.bind();

 const snap = await get(this.roomRef);
 const state = snap.val();

 // 👉 ВАЖНО: регистрируем гостя
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

 // если гость уже есть — не перетираем
 if (state.players?.guest) return;

 await update(this.roomRef, {
  "players/guest": "p2"
 });
}

 // =========================
 // LIVE LISTEN
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const state = snap.val();
   if (!state) return;

   this.listeners.state.forEach(cb => cb(state));

   // LIVE CONFIG (для лобби)
   if (state.draftConfig) {
    this.listeners.draftConfig.forEach(cb => cb(state.draftConfig));
   }

   if (state.config) {
    this.listeners.config.forEach(cb => cb(state.config));
   }

   if (state.guestReady) {
    this.listeners.guestReady.forEach(cb => cb(state));
   }

   if (state.started) {
    this.listeners.start.forEach(cb => cb(state));
   }
  });
 }

 // =========================
 // DRAFT CONFIG (LIVE SYNC)
 // =========================
 async setDraftConfig(partialConfig) {
  if (!this.roomRef) return;

  await update(this.roomRef, {
   draftConfig: partialConfig
  });
 }

 // =========================
 // LOCK CONFIG (HOST START GAME)
 // =========================
 async lockConfigAndStart() {
  const snap = await get(this.roomRef);
  const state = snap.val();

  if (!state?.guestReady) return;

  await update(this.roomRef, {
   config: state.draftConfig,
   started: true,
   startedAt: Date.now()
  });
 }

 // =========================
 // GUEST READY
 // =========================
 async setGuestReady() {
  if (!this.roomRef) return;

  await update(this.roomRef, {
   guestReady: true
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
