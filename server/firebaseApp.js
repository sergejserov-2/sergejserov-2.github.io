import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
 apiKey: "AIzaSyBINTgjBBLq7pn-oi6tlAxx...",
 authDomain: "mini-game-by-loc.firebaseapp.com",
 databaseURL: "https://mini-game-by-loc-default-rtdb.europe-west1.firebasedatabase.app",
 projectId: "mini-game-by-loc",
 storageBucket: "mini-game-by-loc.firebasestorage.app",
 messagingSenderId: "934025050812",
 appId: "1:934025050812:web:1c2d15239575857bc32eb9"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
