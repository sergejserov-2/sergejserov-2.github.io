// server/FirebaseRoomController.js

import { ref, set, onValue, update, push, get } from "firebase/database";
import { db } from "./firebase.js";

export class FirebaseRoomController {
 constructor() {
  this.roomRef = null;
  this.roomId = null;

  this.listeners = {
   ready: [],
   update: [],
   start: []
  };
 }

 // =========================
 // CREATE ROOM (HOST)
 // =========================
 async createRoom() {
  const roomRef = push(ref(db, "rooms"));

  this.roomId = roomRef.key;
  this.roomRef = roomRef;

  const roomData = {
   players: 1,
   status: "waiting",
   createdAt: Date.now()
  };

  await set(roomRef, roomData);

  this.listen();

  return {
   roomId: this.roomId,
   inviteLink: `${window.location.origin}/play.html?room=${this.roomId}`
  };
 }

 // =========================
 // JOIN ROOM (CLIENT)
 // =========================
 async joinRoom(roomId) {
  this.roomId = roomId;
  this.roomRef = ref(db, `rooms/${roomId}`);

  const snap = await get(this.roomRef);
  if (!snap.exists()) throw new Error("Room not found");

  const data = snap.val();

  await update(this.roomRef, {
   players: (data.players || 1) + 1,
   status: "ready"
  });

  this.listen();
 }

 // =========================
 // LISTEN ROOM
 // =========================
 listen() {
  onValue(this.roomRef, (snap) => {
   const data = snap.val();
   if (!data) return;

   this.listeners.update.forEach(cb => cb(data));

   if (data.status === "ready") {
    this.listeners.ready.forEach(cb => cb(data));
   }

   if (data.status === "started") {
    this.listeners.start.forEach(cb => cb(data));
   }
  });
 }

 // =========================
 // START GAME (HOST ONLY)
 // =========================
 async startGame() {
  await update(this.roomRef, {
   status: "started"
  });
 }

 // =========================
 // EVENTS
 // =========================
 onUpdate(cb) {
  this.listeners.update.push(cb);
 }

 onReady(cb) {
  this.listeners.ready.push(cb);
 }

 onStart(cb) {
  this.listeners.start.push(cb);
 }
}
