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
 GAME_STARTED: "GAME_STARTED",
 ROUND_STARTED: "ROUND_STARTED",
 GUESS: "GUESS",
 ROUND_COMPLETE: "ROUND_COMPLETE"
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
   roundStarted: [],
   guess: [],
   roundComplete: []
  };

  // защита от повторной обработки
  this.seen = new Set();

  // локально (только для UI ожидания)
  this.guestReady = false;
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
   inviteLink:
    `${window.location.origin}/waiting.html?room=${this.roomId}&role=guest`
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
 // SUBSCRIBE
 // =========================
 bind() {
  const eventsRef = ref(this.db, `rooms/${this.roomId}/events`);

  onValue(eventsRef, (snap) => {
   const data = snap.val() || {};
   const events = Object.values(data).sort((a, b) => a.ts - b.ts);

   for (const e of events) {

    if (this.seen.has(e.id)) continue;
    this.seen.add(e.id);

    switch (e.type) {

     case EVENTS.CONFIG_UPDATED:
      this.listeners.draftConfig.forEach(cb =>
       cb(e.payload)
      );
      break;

     case EVENTS.GUEST_READY:
      this.guestReady = true;
      this.emitState();
      break;

     case EVENTS.GAME_STARTED:
      this.listeners.start.forEach(cb =>
       cb(e.payload)
      );
      break;

     case EVENTS.ROUND_STARTED:
      this.listeners.roundStarted.forEach(cb =>
       cb(e.payload)
      );
      break;

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
  });
 }

 // =========================
 // STATE (minimal only guestReady)
 // =========================
 emitState() {
  // не ломаем архитектуру — только флаг ожидания
  this.listeners.state?.forEach(cb =>
   cb({ guestReady: this.guestReady })
  );
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

 sendRoundStarted(payload) {
  return this.emitEvent(EVENTS.ROUND_STARTED, payload);
 }

 sendGuess(payload) {
  return this.emitEvent(EVENTS.GUESS, payload);
 }

 sendRoundComplete() {
  return this.emitEvent(EVENTS.ROUND_COMPLETE);
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
onRoundStarted(cb) {
  this.listeners.roundStarted.push(cb);
 }

 onGuess(cb) {
  this.listeners.guess.push(cb);
 }

 onRoundComplete(cb) {
  this.listeners.roundComplete.push(cb);
 }

 onState(cb) {
  this.listeners.state.push(cb);
  cb({ guestReady: this.guestReady });
 }
}
