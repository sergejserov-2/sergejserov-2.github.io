import {
 ref,
 set,
 onValue,
 push,
 get
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

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
 // EVENT EMIT
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
 // SUBSCRIBE
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
 // REPLAY
 // =========================
 replay(events) {
  for (const e of events) {
   if (this.lastSeenEvents.has(e.id)) continue;
   this.lastSeenEvents.add(e.id);

   switch (e.type) {

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
   }
  }
 }

 // =========================
 // ACTIONS
 // =========================
 async sendGuestJoined() {
  await this.emitEvent(EVENTS.GUEST_JOINED);
 }

 async setDraftConfig(config) {
  await this.emitEvent(EVENTS.CONFIG_UPDATED, config);
 }

 async setGuestReady() {
  await this.emitEvent(EVENTS.GUEST_READY);
 }

 async lockConfigAndStart(config) {
  await this.emitEvent(EVENTS.GAME_STARTED, {
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

 onState(cb) {
  this.listeners.state.push(cb);
 }
}
