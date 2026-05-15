// ============================================================
// CONFIGURAZIONE FIREBASE
// ============================================================
// 1. Vai su https://console.firebase.google.com
// 2. Crea un nuovo progetto
// 3. Aggiungi un'app web (icona </>)
// 4. Copia le credenziali qui sotto
// 5. Abilita solo: Authentication (Email/Password), Firestore
//    Non abilitare Cloud Storage se vuoi restare senza carta/piano Blaze.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "INSERISCI-QUI",
  authDomain: "INSERISCI-QUI.firebaseapp.com",
  projectId: "INSERISCI-QUI",
  storageBucket: "INSERISCI-QUI.appspot.com",
  messagingSenderId: "INSERISCI-QUI",
  appId: "INSERISCI-QUI"
};

// ============================================================
// EMAIL ADMIN: cambia con la tua email
// ============================================================
export const ADMIN_EMAIL = "admin@songtournament.com";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
