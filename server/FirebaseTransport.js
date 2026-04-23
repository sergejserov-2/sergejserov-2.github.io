import { getDatabase, ref, push, onChildAdded } from "firebase/database";

export class FirebaseTransport {
 constructor(roomId) {
  this.db = getDatabase();
  this.roomRef = ref(this.db, rooms/${roomId});

  this.listeners = {};
 }

 emit(event, data) {
  push(ref(this.db, rooms/${roomId}/events), {
   event,
   data,
   timestamp: Date.now()
  });
 }

 on(event, cb) {
  const eventsRef = ref(this.db, rooms/${roomId}/events);

  onChildAdded(eventsRef, (snapshot) => {
   const value = snapshot.val();
   if (value.event === event) {
    cb(value.data);
   }
  });
 }
}
