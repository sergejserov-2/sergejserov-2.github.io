import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, onValue } from "firebase/database";

export class FirebaseTransport {
 constructor() {
  this.app = initializeApp(window.FIREBASE_CONFIG);
  this.db = getDatabase(this.app);
 }

 async createRoom(roomId, data) {
  await set(ref(this.db, rooms/${roomId}), data);
 }

 async updateRoom(roomId, data) {
  await update(ref(this.db, rooms/${roomId}), data);
 }

 subscribeRoom(roomId, cb) {
  const roomRef = ref(this.db, rooms/${roomId});

  onValue(roomRef, (snapshot) => {
   cb(snapshot.val());
  });
 }
}
