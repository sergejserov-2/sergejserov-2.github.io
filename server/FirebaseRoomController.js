import {
 ref,
 set,
 onValue,
 push,
 get
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

// =========================
// EVENTS
// =========================
const EVENTS = {
 CONFIG_UPDATED: "CONFIG_UPDATED",
 GUEST_READY: "GUEST_READY",
 GAME_STARTED: "GAME_STARTED"
};

export class FirebaseRoomController {
 constructor() {
  this.db = db;

  this.roomId = null;
  this.roomRef = null;

  // listeners
  this.listeners = {
   start: [],
   draftConfig: [],
   guestReady: []
  };

  this.lastSeen = new Set();
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
   draftConfig: initialConfig,
   events: {}
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

  this.bind();

  const snap = await get(this.roomRef);
  return snap.val();
 }

 // =========================
 // EMIT EVENT
 // =========================
 async emitEvent(type, payload = {}) {
  const eventsRef = ref(this.db, `rooms/${this.roomId}/events`);
  const id = push(eventsRef).key;

  await set(ref(this.db, `rooms/${this.roomId}/events/${id}`), {
   id,
   type,
   payload,
   ts: Date.now()
  });
 }

 // =========================
 // BIND EVENTS
 // =========================
 bind() {
  const eventsRef = ref(this.db, `rooms/${this.roomId}/events`);

  onValue(eventsRef, (snap) => {
   const data = snap.val() || {};
   const events = Object.values(data).sort((a, b) => a.ts - b.ts);

   for (const e of events) {
    if (this.lastSeen.has(e.id)) continue;
    this.lastSeen.add(e.id);

    switch (e.type) {

     case EVENTS.CONFIG_UPDATED:
      this.listeners.draftConfig.forEach(cb =>
       cb(e.payload)
      );
      break;

     case EVENTS.GUEST_READY:
      this.listeners.guestReady.forEach(cb =>
       cb(e.payload)
      );
      break;

     case EVENTS.GAME_STARTED:
      this.listeners.start.forEach(cb =>
       cb(e.payload)
      );
      break;
    }
   }
  });
 }

 // =========================
 // API
 // =========================
 setDraftConfig(cfg) {
  return this.emitEvent(EVENTS.CONFIG_UPDATED, cfg);
 }

 setGuestReady() {
  return this.emitEvent(EVENTS.GUEST_READY);
 }

 lockConfigAndStart(config) {
  return this.emitEvent(EVENTS.GAME_STARTED, {
   config,
   startedAt: Date.now()
  });
 }

 // =========================
 // LISTENERS
 // =========================
 onStart(cb) {
  this.listeners.start.push(cb);
 }

 onDraftConfig(cb) {
  this.listeners.draftConfig.push(cb);
 }

 onGuestReady(cb) {
  this.listeners.guestReady.push(cb);
 }
}
