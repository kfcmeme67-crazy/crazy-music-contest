// ============================================================
// CONFIGURAZIONE FIREBASE
// ============================================================
// 1. Vai su https://console.firebase.google.com
// 2. Crea un nuovo progetto
// 3. Aggiungi un'app web (icona </>)
// 4. Copia le credenziali qui sotto
// 5. Abilita: Authentication (Email/Password), Firestore e Storage
//    Storage serve per caricare MP3 e copertine dal pannello admin.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAttUthMmWOxCCapvaSoWUbqB-gtKN-Rcc",
  authDomain: "crazy-music-contest.firebaseapp.com",
  projectId: "crazy-music-contest",
  storageBucket: "crazy-music-contest.firebasestorage.app",
  messagingSenderId: "134249760147",
  appId: "1:134249760147:web:d2988d5a4e33a6fb671466",
  measurementId: "G-H10LLZJWSC"
};

// ============================================================
// EMAIL ADMIN: cambia con la tua email
// ============================================================
export const ADMIN_EMAIL = "kfcmeme67@gmail.com";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
