//update
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBINTgjBBLq7pn-oi6tlxAqSgb0spkPSIs",
  authDomain: "mini-game-by-loc.firebaseapp.com",
  projectId: "mini-game-by-loc",
  storageBucket: "mini-game-by-loc.firebasestorage.app",
  messagingSenderId: "934025050812",
  appId: "1:934025050812:web:1c2d15239575857bc32eb9",
  databaseURL: "https://mini-game-by-loc-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
