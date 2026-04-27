import {
  ref,
  set,
  onValue,
  push,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

import { db } from "./firebaseApp.js";

export class FirebaseRoomController {
  constructor() {
    this.db = db;
    this.roomId = null;
    this.roomRef = null;

    this.listeners = {
      room: []
    };
  }

  // =========================
  // CREATE ROOM
  // =========================
  async createRoom(initialDraft = {}) {
    const roomsRef = ref(this.db, "rooms");
    const newRoom = push(roomsRef);

    this.roomId = newRoom.key;
    this.roomRef = ref(this.db, `rooms/${this.roomId}`);

    await set(this.roomRef, {
      roomId: this.roomId,

      players: {
        host: { connected: true, ready: false },
        guest: { connected: false, ready: false }
      },

      game: {
        started: false,
        round: null
      },

      // 💡 ONLY LOBBY STATE
      draftConfig: initialDraft
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

    const snap = await get(this.roomRef);
    const room = snap.val();

    if (!room) throw new Error("Room not found");

    await update(this.roomRef, {
      "players/guest/connected": true
    });

    this.bind();

    return room;
  }

  // =========================
  // LISTEN
  // =========================
  bind() {
    onValue(this.roomRef, (snap) => {
      const room = snap.val();
      if (!room) return;

      this.listeners.room.forEach(cb => cb(room));
    });
  }

  onRoom(cb) {
    this.listeners.room.push(cb);
  }

  // =========================
  // DRAFT CONFIG (ONLY LOBBY UI)
  // =========================
  setDraftConfig(cfg) {
    if (!this.roomRef) return;
    return update(this.roomRef, {
      draftConfig: cfg
    });
  }

  // =========================
  // READY
  // =========================
  setGuestReady() {
    return update(this.roomRef, {
      "players/guest/ready": true
    });
  }

  // =========================
  // START GAME
  // =========================
  startGame(config) {
    return update(this.roomRef, {
      "game/started": true,
      "game/round": null
    });
  }

  // =========================
  // ROUND SYNC (ONLY GAME STATE)
  // =========================
  setRound(round) {
    return update(this.roomRef, {
      "game/round": round
    });
  }

  updateGuess(playerId, result) {
    return update(this.roomRef, {
      [`game/round/guesses/${playerId}`]: result
    });
  }
}
