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
// EVENT TYPES
// =========================
const EVENTS = {
 GUEST_JOINED: "GUEST_JOINED",
 CONFIG_UPDATED: "CONFIG_UPDATED",
 GUEST_READY: "GUEST_READY",
 GAME_STARTED: "GAME_STARTED"
};

export class FirebaseRoomController {
 constructor() {
  this.db = db;

  this.roomId = null;
  this.roomRef = null;

  this.listeners = {
   start: [],
   draftConfig: [],
   state: []
  };

  this.lastSeenEvents = new Set();
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
    host: "p1",
    guest: null
   },
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

  await this.emitEvent(EVENTS.GUEST_JOINED);

  const snap = await get(this.roomRef);
  return snap.val();
 }

 // =========================
 // EVENT EMITTER
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
 // LIVE SUBSCRIBE (FSM CORE)
 // =========================
 bind() {
  const eventsRef = ref(this.db, `rooms/${this.roomId}/events`);

  onValue(eventsRef, (snap) => {
   const eventsObj = snap.val() || {};
   const events = Object.values(eventsObj)
    .sort((a, b) => a.ts - b.ts);

   this.replay(events);
  });
 }

 // =========================
 // FSM REDUCER (event replay)
 // =========================
 replay(events) {
  for (const e of events) {
   if (this.lastSeenEvents.has(e.id)) continue;
   this.lastSeenEvents.add(e.id);

   switch (e.type) {

    case EVENTS.CONFIG_UPDATED:
     this.listeners.draftConfig?.forEach(cb =>
      cb(e.payload)
     );
     break;

    case EVENTS.GUEST_READY:
     this.listeners.state?.forEach(cb =>
      cb({ guestReady: true })
     );
     break;

    case EVENTS.GAME_STARTED:
     this.listeners.start.forEach(cb =>
      cb(e.payload)
     );
     break;
   }
  }
 }

 // =========================
 // CONFIG LIVE UPDATE
 // =========================
 async setDraftConfig(partialConfig) {
  await this.emitEvent(EVENTS.CONFIG_UPDATED, partialConfig);
 }

 // =========================
 // GUEST READY
 // =========================
 async setGuestReady() {
  await this.emitEvent(EVENTS.GUEST_READY);
 }

 // =========================
 // START GAME (CRITICAL FIX)
 // =========================
 async lockConfigAndStart() {
  const snap = await get(this.roomRef);
  const room = snap.val();

  if (!room) return;

  await this.emitEvent(EVENTS.GAME_STARTED, {
   config: room.draftConfig,
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

 onState(cb) {
  this.listeners.state.push(cb);
 }
}
