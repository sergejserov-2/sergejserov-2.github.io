import {
 ref,
 set,
 update,
 onValue,
 push,
 get
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

// =========================
// ROOM STATES (FSM)
// =========================
const ROOM_STATE = {
 LOBBY: "lobby",
 READY: "ready",
 STARTED: "started"
};

// =========================
// PLAYERS
// =========================
const PLAYER_IDS = {
 HOST: "p1",
 GUEST: "p2"
};

export class FirebaseRoomController {
 constructor() {
  this.db = db;

  this.roomId = null;
  this.roomRef = null;

  this.role = null; // host | guest
  this.playerId = null;

  this.listeners = {
   config: [],
   state: [],
   guestReady: [],
   start: []
  };

  this._lastState = null;
 }

 // =========================
 // CREATE ROOM (HOST)
 // =========================
 async createRoom(initialConfig = {}) {
  const roomsRef = ref(this.db, "rooms");
  const newRoom = push(roomsRef);

  this.roomId = newRoom.key;
  this.roomRef = ref(this.db, `rooms/${this.roomId}`);

  this.role = "host";
  this.playerId = PLAYER_IDS.HOST;

  const state = {
   roomId: this.roomId,

   state: ROOM_STATE.LOBBY,

   config: initialConfig,

   hostId: this.playerId,
   guestId: null,

   guestReady: false,
   started: false,

   createdAt: Date.now()
  };

  await set(this.roomRef, state);

  this.bind();

  return {
   roomId: this.roomId,
   inviteLink: `${window.location.origin}/waiting.html?room=${this.roomId}`
  };
 }

 // =========================
 // JOIN ROOM (GUEST)
 // =========================
 async joinRoom(roomId) {
  this.roomId = roomId;
  this.roomRef = ref(this.db, `rooms/${roomId}`);

  this.role = "guest";
  this.playerId = PLAYER_IDS.GUEST;

  const snap = await get(this.roomRef);
  const state = snap.val();

  if (!state) throw new Error("Room not found");

  // assign guest once
  await update(this.roomRef, {
   guestId: this.playerId
  });

  this.bind();

  return state;
 }

 // =========================
 // BIND STATE STREAM
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const state = snap.val();
   if (!state) return;

   this._lastState = state;

   // config live (ONLY before start)
   if (state.state !== ROOM_STATE.STARTED) {
    this.listeners.config.forEach(cb => cb(state.config));
   }

   this.listeners.state.forEach(cb => cb(state));

   if (state.guestReady) {
    this.listeners.guestReady.forEach(cb => cb(state));
   }

   if (state.started) {
    this.listeners.start.forEach(cb => cb(state));
   }
  });
 }

 // =========================
 // CONFIG UPDATE (HOST ONLY, LOBBY ONLY)
 // =========================
 async updateConfig(patch) {
  if (!this.roomRef) return;
  if (this.role !== "host") return;
  if (this._lastState?.state !== ROOM_STATE.LOBBY) return;

  await update(this.roomRef, {
   config: {
    ...this._lastState.config,
    ...patch
   }
  });
 }

 // =========================
 // GUEST READY
 // =========================
 async setGuestReady() {
  if (!this.roomRef) return;

  await update(this.roomRef, {
   guestReady: true,
   state: ROOM_STATE.READY
  });
 }

 // =========================
 // START GAME (HOST ONLY)
 // =========================
 async startGame() {
  if (!this.roomRef) return;

  const snap = await get(this.roomRef);
  const state = snap.val();

  if (!state) return;
  if (!state.guestReady) return;

  await update(this.roomRef, {
   state: ROOM_STATE.STARTED,
   started: true,
   startedAt: Date.now()
  });
 }

 // =========================
 // EVENTS
 // =========================
 onConfig(cb) {
  this.listeners.config.push(cb);
 }

 onState(cb) {
  this.listeners.state.push(cb);
 }

 onGuestReady(cb) {
  this.listeners.guestReady.push(cb);
 }

 onStart(cb) {
  this.listeners.start.push(cb);
 }

 // =========================
 // GETTERS
 // =========================
 getRoomId() {
  return this.roomId;
 }

 getPlayerId() {
  return this.playerId;
 }

 getRole() {
  return this.role;
 }
}
