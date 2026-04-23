import {
 ref,
 set,
 update,
 onValue,
 push,
 get
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";
import { firebaseApp } from "./FirebaseApp.js";

export class FirebaseRoomController {
 constructor() {
  this.db = getDatabase(firebaseApp);

  this.roomId = null;
  this.roomRef = null;

  this.listeners = {
   guestReady: [],
   start: [],
   config: [],
   state: []
  };
 }

 // =========================
 // CREATE ROOM (HOST)
 // =========================
 async createRoom(config) {
  const roomsRef = ref(this.db, "rooms");
  const newRoom = push(roomsRef);

  this.roomId = newRoom.key;
  this.roomRef = ref(this.db, `rooms/${this.roomId}`);

  const state = {
   roomId: this.roomId,
   config,

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

  this.bind();

  const snap = await get(this.roomRef);
  return snap.val();
 }

 // =========================
 // LISTEN STATE
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const state = snap.val();
   if (!state) return;

   this.listeners.state.forEach(cb => cb(state));
   this.listeners.config.forEach(cb => cb(state.config));

   if (state.guestReady) {
    this.listeners.guestReady.forEach(cb => cb());
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
  await update(this.roomRef, {
   guestReady: true
  });
 }

 // =========================
 // START GAME (HOST)
 // =========================
 async startGame() {
  const snap = await get(this.roomRef);
  const state = snap.val();

  if (!state?.guestReady) return;

  await update(this.roomRef, {
   started: true,
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

 onState(cb) {
  this.listeners.state.push(cb);
 }
}
