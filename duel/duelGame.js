import { ref, get, update, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { db } from "./firebase.js";
import { Game } from "../Game.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");
const roomRef = ref(db, `rooms/${roomId}`);
const playBtn = document.getElementById("playBtn")

let gameInstance;
let geoMapInstance;

let started = false;
let playerRole = null;
let playerId = crypto.randomUUID(); 
  console.log("Игрок:", playerId);

export function initDuel(game, geoMap, roomRef) {
  if (!roomRef) return;
  gameInstance = game;
  geoMapInstance = geoMap;
  gameInstance.onRoundStarted = (data) => {
      firebase.update({
          currentRound: data.round,
          currentLocation: data.location,
          roundTrigger: Date.now()
      });
  };
  let lastTrigger = null;
  onValue(roomRef, (snap) => {
      const data = snap.val();
  
      if (data.roundTrigger && data.roundTrigger !== lastTrigger) {
          lastTrigger = data.roundTrigger;
  
          gameInstance.currentRound = data.currentRound;
          gameInstance.playRemoteRound(data.currentLocation);
      }
  });
}


// режим "Дуэль"

if (roomId) {
  console.log("Дуэль, комната:", roomId);
  joinRoom();
}



// Вход игроков

async function joinRoom() {
  const snap = await get(roomRef);
  const data = snap.val();
  let players = data.players || {};
  const count = Object.keys(players).length;

  // Ошибки
  if (!snap.exists()) {
    alert("Комната не найдена");
    return;
  }
  if (Object.keys(players).length >= 2) {
    alert("Комната заполнена");
    return;
  }

  // Игроки и их роли
  if (!players.player1) {
    playerRole = "host";
    const playerRef = ref(db, `rooms/${roomId}/players/player1`);
    await update(roomRef, {
        players: {
          ...players, player1: { id: playerId }
        }
    });
    onDisconnect(playerRef).remove();
  } else if (!players.player2) {
    playerRole = "client";
    const playerRef = ref(db, `rooms/${roomId}/players/player2`);
    await update(roomRef, {
        players: {
          ...players, player2: { id: playerId }
        }
    });
    onDisconnect(playerRef).remove();
  }
  console.log("Готово");
  duelScript();
}



// Основная функция

function duelScript() {
  onValue(roomRef, (snap) => {
    const data = snap.val();
    const players = data.players || {};
    const count = Object.keys(players).length;

    if (count === 0) {
      remove(roomRef);
    };
  
    // обновляем роль (важно!)
    if (players.player1?.id === playerId) playerRole = "host";
    if (players.player2?.id === playerId) playerRole = "client";
    console.log("Обновление данных:", data);

    if (data.status === "waiting") {
      console.log("⏳ waiting for players");
      if (count === 2) {
        update(roomRef, { status: "ready" });
      }
    }

    if (data.status === "ready") {
      playBtn.value = "Начать игру";
    }

    if (data.status === "playing") {
      syncStart(data);
      gameInstance.hideGameRuleSelection();
    }

    if (data.status === "nextRound") {
      if (playerRole !== "host") return;
      gameInstance.nextRound();
    }
    
    if (data.currentLocation && gameInstance) {
      gameInstance.playRemoteRound(data.currentLocation);
    }
  });
}



// Синхронизированный старт

function syncStart(data) {
  if (started) return;
  started = true;

  function waitForGame() {
    if (!gameInstance) {
      console.log("⏳ ждём game...");
      setTimeout(waitForGame, 50);
      return;
    }
    const delay = data.startAt - Date.now();
    console.log("⏱️ старт через:", delay);
    setTimeout(() => {
      console.log("🚀 СТАРТ");
      gameInstance.start({
        map: geoMapInstance
      });
    }, Math.max(0, delay));
  }

  waitForGame();
}



//Кнопка

playBtn.addEventListener("click", async () => {
  const snap = await get(roomRef);
  const data = snap.val();
  const players = data.players || {};
  
  await update(roomRef, {
    status: "playing",
    startAt: Date.now() + 2000
  });

});
