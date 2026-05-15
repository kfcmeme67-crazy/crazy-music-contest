// ============================================================
// MODULO AUTH - gestisce login, registrazione, sessione utente
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { auth, db, ADMIN_EMAIL } from "./firebase-config.js";

/**
 * Registra un nuovo utente.
 * Internamente usa l'email "username@songtournament.local" per Firebase Auth
 * così l'utente può registrarsi solo con username e password come richiesto.
 */
export async function registerUser(username, password) {
  username = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    throw new Error("Username: 3-20 caratteri, solo lettere minuscole, numeri e underscore");
  }
  if (password.length < 6) {
    throw new Error("La password deve avere almeno 6 caratteri");
  }

  // Verifica unicità username
  const usernameDoc = await getDoc(doc(db, "usernames", username));
  if (usernameDoc.exists()) {
    throw new Error("Username già in uso");
  }

  // Email "fittizia" per Firebase Auth
  const fakeEmail = `${username}@songtournament.local`;
  const cred = await createUserWithEmailAndPassword(auth, fakeEmail, password);

  await updateProfile(cred.user, { displayName: username });

  // Salva profilo utente
  await setDoc(doc(db, "users", cred.user.uid), {
    username,
    isAdmin: false,
    createdAt: serverTimestamp()
  });

  // Salva mapping username -> uid per garantire unicità
  await setDoc(doc(db, "usernames", username), {
    uid: cred.user.uid
  });

  return cred.user;
}

/** Login con username + password. */
export async function loginUser(username, password) {
  username = username.trim().toLowerCase();
  const fakeEmail = `${username}@songtournament.local`;
  const cred = await signInWithEmailAndPassword(auth, fakeEmail, password);
  return cred.user;
}

/** Logout. */
export function logoutUser() {
  return signOut(auth);
}

/**
 * Carica profilo completo (compreso flag isAdmin)
 * Il flag admin è determinato in due modi:
 * 1. Email speciale (ADMIN_EMAIL in firebase-config)
 * 2. Flag isAdmin: true nel documento utente (impostabile manualmente in Firestore)
 */
export async function getUserProfile(user) {
  if (!user) return null;
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Admin se ha il flag nel documento O se l'username è "admin"
  const isAdmin = data.isAdmin === true || data.username === "admin";
  return { uid: user.uid, ...data, isAdmin };
}

/**
 * Wrapper su onAuthStateChanged che fornisce subito il profilo completo
 * (con info admin). Restituisce l'unsubscribe function.
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
    } else {
      const profile = await getUserProfile(user);
      callback(profile);
    }
  });
}

/**
 * Forza il redirect a login.html se l'utente NON è loggato.
 * Utile in cima alle pagine protette.
 */
export function requireAuth(callback) {
  return watchAuthState((profile) => {
    if (!profile) {
      window.location.href = "login.html";
    } else {
      callback(profile);
    }
  });
}

/** Variante che richiede anche privilegi admin. */
export function requireAdmin(callback) {
  return watchAuthState((profile) => {
    if (!profile) {
      window.location.href = "login.html";
      return;
    }
    if (!profile.isAdmin) {
      alert("Accesso riservato all'amministratore");
      window.location.href = "index.html";
      return;
    }
    callback(profile);
  });
}
