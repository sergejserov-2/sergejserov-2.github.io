// server/FirebaseRoomController.js

import {
 ref,
 set,
 update,
 onValue,
 push,
 get,
 off
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

export class FirebaseRoomController {
 constructor() {
  this.db = db;

  this.roomId = null;
  this.roomRef = null;

  // internal unsubscribe guard
  this.unsubscribe = null;

  this.listeners = {
   guestReady: [],
   start: [],
   config: [],
   state: []
  };

  this.lastState = null;
 }

 // =========================
 // CREATE ROOM (HOST)
 // =========================
 async createRoom(config) {
  const roomsRef = ref(this.db, "rooms");
  const newRoom = push(roomsRef);

  this.roomId = newRoom.key;
  this.roomRef = ref(this.db, `rooms/${this.roomId}`);

  const initialState = {
   roomId: this.roomId,

   // CONFIG (LIVE DRAFT)
   config,

   // FSM
   state: "WAITING", // WAITING | READY | STARTED

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

  this.bind();

  const snap = await get(this.roomRef);
  return snap.val();
 }

 // =========================
 // BIND (IMPORTANT FIXED)
 // =========================
 bind() {
  if (!this.roomRef) return;

  // prevent duplicate listeners
  off(this.roomRef);

  onValue(this.roomRef, (snap) => {
   const state = snap.val();
   if (!state) return;

   this.lastState = state;

   // global state
   this.listeners.state.forEach(cb => cb(state));

   // live config (IMPORTANT: always live)
   this.listeners.config.forEach(cb => cb(state.config));

   // guest ready event (fire once logic handled externally)
   if (state.guestReady) {
    this.listeners.guestReady.forEach(cb => cb(state));
   }

   // start event
   if (state.started) {
    this.listeners.start.forEach(cb => cb(state));
   }
  });
 }

 // =========================
 // HOST: UPDATE CONFIG (LIVE DRAFT)
 // =========================
 async updateConfig(partialConfig) {
  if (!this.roomRef) return;

  await update(this.roomRef, {
   config: {
    ...this.lastState?.config,
    ...partialConfig
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
   state: "READY"
  });
 }

 // =========================
 // HOST START GAME
 // =========================
 async startGame() {
  const snap = await get(this.roomRef);
  const state = snap.val();

  if (!state) return;
  if (!state.guestReady) return;

  await update(this.roomRef, {
   started: true,
   state: "STARTED",
   startedAt: Date.now()
  });
 }

 // =========================
 // EVENTS API
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

 onState(cb) {
  this.listeners.state.push(cb);
 }
}
