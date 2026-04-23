// server/FirebaseRoomController.js

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
// ROOM FSM STATES
// =========================
const ROOM_STATE = {
 CREATED: "CREATED",
 WAITING_FOR_GUEST: "WAITING_FOR_GUEST",
 GUEST_CONNECTED: "GUEST_CONNECTED",
 CONFIGURING: "CONFIGURING",
 READY_TO_START: "READY_TO_START",
 STARTED: "STARTED"
};

export class FirebaseRoomController {
 constructor() {
  this.db = db;

  this.roomId = null;
  this.roomRef = null;

  this.lastState = null;

  this.listeners = {
   state: [],
   config: [],
   guestReady: [],
   start: []
  };
 }

 // =========================
 // CREATE ROOM
 // =========================
 async createRoom(config) {
  const roomsRef = ref(this.db, "rooms");
  const newRoom = push(roomsRef);

  this.roomId = newRoom.key;
  this.roomRef = ref(this.db, `rooms/${this.roomId}`);

  const initialState = {
   roomId: this.roomId,

   state: ROOM_STATE.WAITING_FOR_GUEST,

   configLive: config,
   configFrozen: null,

   hostId: "host",
   guestId: null,

   guestReady: false,
   started: false,

   createdAt: Date.now()
  };

  await set(this.roomRef, initialState);

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

  const snap = await get(this.roomRef);
  const state = snap.val();

  if (!state) throw new Error("Room not found");

  // attach guest
  await update(this.roomRef, {
   guestId: "guest",
   state: ROOM_STATE.GUEST_CONNECTED
  });

  this.bind();

  return state;
 }

 // =========================
 // LIVE STATE LISTENER
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const state = snap.val();
   if (!state) return;

   this.lastState = state;

   // config live sync (ONLY before start)
   this.listeners.config.forEach(cb => cb(state.configLive));

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
 // GUEST READY
 // =========================
 async setGuestReady() {
  if (!this.roomRef) return;

  const state = this.lastState;
  if (!state) return;

  if (state.started) return;

  const nextState =
   state.guestId
    ? ROOM_STATE.READY_TO_START
    : state.state;

  await update(this.roomRef, {
   guestReady: true,
   state: nextState
  });
 }

 // =========================
 // START GAME (HOST ONLY)
 // =========================
 async startGame() {
  const state = this.lastState;
  if (!state) return;

  if (!state.guestReady) return;

  await update(this.roomRef, {
   started: true,
   state: ROOM_STATE.STARTED,
   configFrozen: state.configLive,
   startedAt: Date.now()
  });
 }

 // =========================
 // UPDATE CONFIG (LIVE BEFORE START)
 // =========================
 async updateConfig(patch) {
  const state = this.lastState;
  if (!state) return;

  if (state.started) return;

  await update(this.roomRef, {
   configLive: {
    ...state.configLive,
    ...patch
   },
   state: ROOM_STATE.CONFIGURING
  });
 }

 // =========================
 // EVENTS API
 // =========================
 onState(cb) {
  this.listeners.state.push(cb);
 }

 onConfig(cb) {
  this.listeners.config.push(cb);
 }

 onGuestReady(cb) {
  this.listeners.guestReady.push(cb);
 }

 onStart(cb) {
  this.listeners.start.push(cb);
 }

 // optional helper
 getCurrentState() {
  return Promise.resolve(this.lastState);
 }
}
