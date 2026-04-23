import {
 getDatabase,
 ref,
 set,
 get,
 update,
 onValue,
 push
} from "firebase/database";

export class FirebaseRoomController {
 constructor(app) {
  this.db = getDatabase(app);

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

  const initialState = {
   roomId: this.roomId,
   config,

   guestReady: false,
   started: false,

   createdAt: Date.now()
  };

  await set(this.roomRef, initialState);

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
  return snap.val();
 }

 // =========================
 // FIREBASE BIND
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const state = snap.val();
   if (!state) return;

   // full state
   this.listeners.state.forEach(cb => cb(state));

   // config
   this.listeners.config.forEach(cb => cb(state.config));

   // guest ready
   if (state.guestReady) {
    this.listeners.guestReady.forEach(cb => cb());
   }

   // start game
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

  await update(this.roomRef, {
   guestReady: true
  });
 }

 // =========================
 // HOST START GAME
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
