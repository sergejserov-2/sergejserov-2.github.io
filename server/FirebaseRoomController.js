import {
 ref,
 set,
 onValue,
 push,
 get
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

// =========================
// EVENT TYPES
// =========================
const EVENTS = {
 CONFIG_UPDATED: "CONFIG_UPDATED",
 GUEST_READY: "GUEST_READY",
 GAME_STARTED: "GAME_STARTED",

 // 🔥 GAMEPLAY
 GUESS: "GUESS",
 ROUND_COMPLETE: "ROUND_COMPLETE"
};

export class FirebaseRoomController {
 constructor() {
  this.db = db;

  this.roomId = null;
  this.roomRef = null;

  this.listeners = {
   start: [],
   draftConfig: [],
   state: [],

   // 🔥 gameplay
   guess: [],
   roundComplete: []
  };

  this.lastSeenEvents = new Set();
 }

 // =========================
 // CREATE ROOM (HOST)
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
  const eventsRef = ref(this.db, `rooms/${this.roomId}/events)`;
  const id = push(eventsRef).key;

  await set(ref(this.db, `rooms/${this.roomId}/events/${id}`), {
   id,
   type,
   payload,
   ts: Date.now()
  });
 }

 // =========================
 // SUBSCRIBE (EVENT STREAM)
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
 // EVENT REPLAY (FSM CORE)
 // =========================
 replay(events) {
  for (const e of events) {
   if (this.lastSeenEvents.has(e.id)) continue;
   this.lastSeenEvents.add(e.id);

   switch (e.type) {

    // =========================
    // LOBBY
    // =========================
    case EVENTS.CONFIG_UPDATED:
     this.listeners.draftConfig.forEach(cb =>
      cb(e.payload)
     );
     break;

    case EVENTS.GUEST_READY:
     this.listeners.state.forEach(cb =>
      cb({ guestReady: true })
     );
     break;

    case EVENTS.GAME_STARTED:
     this.listeners.start.forEach(cb =>
      cb(e.payload)
     );
     break;

    // =========================
    // GAMEPLAY
    // =========================
    case EVENTS.GUESS:
     this.listeners.guess.forEach(cb =>
      cb(e.payload)
     );
     break;

    case EVENTS.ROUND_COMPLETE:
     this.listeners.roundComplete.forEach(cb =>
      cb()
     );
     break;
   }
  }
 }

 // =========================
 // LOBBY ACTIONS
 // =========================
 async setDraftConfig(config) {
  await this.emitEvent(EVENTS.CONFIG_UPDATED, config);
 }

 async setGuestReady() {
  await this.emitEvent(EVENTS.GUEST_READY);
 }

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
 // GAMEPLAY ACTIONS
 // =========================
 async sendGuess(payload) {
  await this.emitEvent(EVENTS.GUESS, payload);
 }

 async sendRoundComplete() {
  await this.emitEvent(EVENTS.ROUND_COMPLETE);
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
