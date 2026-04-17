import { db } from "./firebase.js";
import { ref, set, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("duelBtn");
   btn.addEventListener("click", async () => {
      const roomsRef = ref(db, "rooms");
      console.log("📁 roomsRef created:", roomsRef);
      const newRoomRef = push(roomsRef);
      console.log("🆕 newRoomRef created:", newRoomRef.key);
      await set(newRoomRef, {
        status: "waiting",
        createdAt: Date.now(),
        players: {}
      });
      console.log("💾 ROOM SAVED TO DB");
      const roomId = newRoomRef.key;
      const link = `${window.location.origin}/duel/index.html?room=${roomId}`;
      window.location.href = link;
  });
});
