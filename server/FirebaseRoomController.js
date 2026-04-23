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
   config: [],
   guestReady: [],
   start: [],
   update: []
  };
 }

 // =========================
 // CREATE ROOM (HOST)
 // =========================
 async createRoom(config) {
  const roomsRef = ref(this.db, "rooms");

  const newRoom = push(roomsRef);

  this.roomId = newRoom.key;
  this.roomRef = ref(this.db, rooms/${this.roomId});

  const initialState = {
   roomId: this.roomId,
   config,
   status: "lobby",

   hostReady: false,
   guestReady: false,

   players: {
    host: true,
    guest: false
   },

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
 // JOIN ROOM (GUEST / HOST RELOAD)
 // =========================
 async joinRoom(roomId) {
  this.roomId = roomId;
  this.roomRef = ref(this.db, `rooms/${roomId}`);

  this.bind();

  const snap = await get(this.roomRef);

  if (!snap.exists()) {
   throw new Error("Room not found");
  }

  return snap.val();
 }

 // =========================
 // BIND FIREBASE STREAM
 // =========================
 bind() {
  onValue(this.roomRef, (snap) => {
   const data = snap.val();
   if (!data) return;

   this.listeners.update.forEach(cb => cb(data));

   this.listeners.config.forEach(cb => cb(data.config));

   if (data.guestReady) {
    this.listeners.guestReady.forEach(cb => cb());
   }

   if (data.status === "started") {
    this.listeners.start.forEach(cb => cb(data));
   }
  });
 }

 // =========================
 // GUEST READY
 // =========================
 async setReady() {
  if (!this.roomRef) return;

  await update(this.roomRef, {
   guestReady: true
  });
 }

 // =========================
 // HOST START GAME
 // =========================
 async startGame() {
  if (!this.roomRef) return;

  const snap = await get(this.roomRef);
  const data = snap.val();

  if (!data.guestReady) {
   console.warn("Guest not ready yet");
   return;
  }

  await update(this.roomRef, {
   status: "started",
   startedAt: Date.now()
  });
 }

 // =========================
 // LISTENERS API
 // =========================
 onConfig(cb) {
  this.listeners.config.push(cb);
 }

 onGuestReady(cb) {
  this.listeners.guestReady.push(cb);
 }

 onStart(cb) {
  this.listeners.start.push(cb);
 }

 onUpdate(cb) {
  this.listeners.update.push(cb);
 }
}
