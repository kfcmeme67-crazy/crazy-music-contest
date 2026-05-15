// ============================================================
// PLAY.JS - logica pagina di gioco
// ============================================================

import { requireAuth, logoutUser } from "./auth.js";
import { db } from "./firebase-config.js";
import {
  collection, query, where, orderBy, limit, getDocs,
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import {
  createBracket, selectWinner, getCurrentMatch,
  getProgress, getRoundName, isPowerOfTwo, largestPowerOfTwo, shuffle
} from "./bracket.js";

const loadingEl = document.getElementById("loading");
const noTournamentEl = document.getElementById("noTournament");
const alreadyPlayedEl = document.getElementById("alreadyPlayed");
const arenaEl = document.getElementById("arena");
const navLinks = document.getElementById("navLinks");

let currentUser = null;
let currentBracket = null;
let currentTournamentId = null;

requireAuth(async (profile) => {
  currentUser = profile;
  renderNav(profile);
  await loadOrStartTournament();
});

function renderNav(profile) {
  navLinks.innerHTML = `
    <span style="color: var(--text-secondary); font-size: 0.85rem;">
      ◉ ${profile.username}${profile.isAdmin ? ' <span class="badge badge-magenta">admin</span>' : ''}
    </span>
    <a href="rankings.html">Classifiche</a>
    ${profile.isAdmin ? '<a href="admin.html">Admin</a>' : ''}
    <a href="#" id="logoutBtn">Esci</a>
  `;
  document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await logoutUser();
    window.location.href = "index.html";
  });
}

/**
 * Logica principale: carica il torneo attivo e lo stato dell'utente.
 *
 * Comportamento:
 * 1. Cerca il torneo "active" più recente
 * 2. Se non esiste -> mostra "nessun torneo"
 * 3. Se l'utente ha già un bracket salvato per quel torneo:
 *    - se completed -> mostra "già giocato"
 *    - se in corso -> riprende da dove era
 * 4. Altrimenti crea un nuovo bracket e lo salva
 */
async function loadOrStartTournament() {
  try {
    // 1. Trova torneo attivo
    let snap;
    try {
      const q = query(
        collection(db, "tournaments"),
        where("status", "==", "active"),
        limit(1)
      );
      snap = await getDocs(q);
    } catch (e) {
      throw new Error("Errore durante la lettura di TOURNAMENTS: " + e.message);
    }

    if (snap.empty) {
      loadingEl.classList.add("hidden");
      noTournamentEl.classList.remove("hidden");
      return;
    }

    const tournamentDoc = snap.docs[0];
    currentTournamentId = tournamentDoc.id;
    const tournament = tournamentDoc.data();

    // 2. Verifica se l'utente ha già un bracket per questo torneo
    const bracketId = `${currentUser.uid}_${currentTournamentId}`;
    const bracketRef = doc(db, "brackets", bracketId);
    let bracketSnap;
    try {
      bracketSnap = await getDoc(bracketRef);
    } catch (e) {
      throw new Error("Errore durante la LETTURA del tuo BRACKET in corso: " + e.message);
    }

    if (bracketSnap.exists()) {
      const data = bracketSnap.data();
      
      // Riconverti l'oggetto rounds in un vero array di array (fix per Firestore)
      if (data.bracket && data.bracket.rounds && !Array.isArray(data.bracket.rounds)) {
        const roundsArr = [];
        const keys = Object.keys(data.bracket.rounds).sort((a, b) => Number(a) - Number(b));
        for (const k of keys) {
          roundsArr.push(data.bracket.rounds[k]);
        }
        data.bracket.rounds = roundsArr;
      }

      if (data.bracket.completed) {
        loadingEl.classList.add("hidden");
        alreadyPlayedEl.classList.remove("hidden");
        document.getElementById("restartBtn").addEventListener("click", () => startNew(tournament));
        return;
      }
      // Riprende il bracket in corso
      currentBracket = data.bracket;
      showArena();
      return;
    }

    // 3. Crea un nuovo bracket
    await startNew(tournament);
  } catch (err) {
    loadingEl.innerHTML = `<div style="color: red; background: #220000; padding: 20px; border: 1px solid red; border-radius: 8px; max-width: 600px; margin: 0 auto; text-align: left;">
      <h3 style="margin-top: 0;">Errore Critico Firebase</h3>
      <p style="font-family: monospace;">${err.message}</p>
      <p style="font-size: 0.9rem; margin-top: 10px;">Se vedi "Missing or insufficient permissions", significa che NON hai incollato le nuove regole nel pannello di Firebase come richiesto precedentemente!</p>
    </div>`;
  }
}

async function startNew(tournament) {
  loadingEl.classList.remove("hidden");
  alreadyPlayedEl.classList.add("hidden");
  arenaEl.classList.add("hidden");

  let songs = tournament.songs || [];

  // Tutti gli utenti giocano LE STESSE canzoni nello STESSO ORDINE
  // (l'admin imposta l'ordine al momento dell'attivazione del torneo)
  if (!isPowerOfTwo(songs.length)) {
    // Invece di tagliare le canzoni, aggiungiamo delle canzoni "Jolly" per arrivare alla potenza di 2 successiva!
    const target = Math.pow(2, Math.ceil(Math.log2(songs.length)));
    const missing = target - songs.length;
    for (let i = 0; i < missing; i++) {
      songs.push({
        id: "jolly_" + i + "_" + Date.now(),
        title: "🎵 CANZONE JOLLY " + (i + 1),
        artist: "Passaggio turno automatico",
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=200&q=80",
        audioUrl: ""
      });
    }
  }

  if (songs.length < 2) {
    loadingEl.classList.add("hidden");
    noTournamentEl.classList.remove("hidden");
    return;
  }

  currentBracket = createBracket(songs);
  await saveBracket();
  showArena();
}

async function saveBracket() {
  try {
    const bracketId = `${currentUser.uid}_${currentTournamentId}`;
    
    // CLONA e converti l'array di array in un oggetto, altrimenti Firestore va in crash
    const bracketToSave = JSON.parse(JSON.stringify(currentBracket));
    const roundsObj = {};
    for (let i = 0; i < bracketToSave.rounds.length; i++) {
      roundsObj[i.toString()] = bracketToSave.rounds[i];
    }
    bracketToSave.rounds = roundsObj;

    await setDoc(doc(db, "brackets", bracketId), {
      userId: currentUser.uid,
      username: currentUser.username,
      tournamentId: currentTournamentId,
      bracket: bracketToSave,
      isPublic: true,
      likes: 0,
      updatedAt: serverTimestamp(),
      completedAt: currentBracket.completed ? serverTimestamp() : null
    }, { merge: true });
  } catch (e) {
    throw new Error("Errore durante il SALVATAGGIO: " + e.message);
  }
}

// ============================================================
// RENDERING
// ============================================================

function showArena() {
  loadingEl.classList.add("hidden");
  alreadyPlayedEl.classList.add("hidden");
  arenaEl.classList.remove("hidden");
  renderCurrentMatch();
}

function renderCurrentMatch() {
  if (currentBracket.completed) {
    window.location.href = "results.html";
    return;
  }

  const match = getCurrentMatch(currentBracket);
  if (!match) {
    window.location.href = "results.html";
    return;
  }

  // Header
  document.getElementById("roundName").textContent = getRoundName(currentBracket);
  document.getElementById("matchNum").textContent = currentBracket.currentMatchIndex + 1;
  document.getElementById("matchTotal").textContent =
    currentBracket.rounds[currentBracket.currentRound].length;
  document.getElementById("progressFill").style.width = getProgress(currentBracket) + "%";

  // Card A
  document.getElementById("titleA").textContent = match.a.title;
  document.getElementById("artistA").textContent = match.a.artist;
  document.getElementById("coverA").src = match.a.coverUrl;
  document.getElementById("audioA").src = match.a.audioUrl;

  // Card B
  document.getElementById("titleB").textContent = match.b.title;
  document.getElementById("artistB").textContent = match.b.artist;
  document.getElementById("coverB").src = match.b.coverUrl;
  document.getElementById("audioB").src = match.b.audioUrl;

  // Reset stati visivi
  document.getElementById("cardA").classList.remove("selected", "eliminated");
  document.getElementById("cardB").classList.remove("selected", "eliminated");
  resetAudio("A");
  resetAudio("B");
}

// ============================================================
// AUDIO PLAYER
// ============================================================

function setupAudio(letter) {
  const audio = document.getElementById("audio" + letter);
  const playBtn = document.getElementById("play" + letter);
  const fill = document.getElementById("progressFill" + letter);
  const time = document.getElementById("time" + letter);
  const progressBar = document.getElementById("progress" + letter);

  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // Non suonare nulla se è una canzone Jolly senza audio
    const audioSrc = audio.getAttribute("src");
    if (!audioSrc || audioSrc === window.location.href) return;

    // Pausa l'altro audio
    const other = letter === "A" ? "B" : "A";
    const otherAudio = document.getElementById("audio" + other);
    if (!otherAudio.paused) {
      otherAudio.pause();
      document.getElementById("play" + other).textContent = "▶";
    }

    if (audio.paused) {
      audio.play();
      playBtn.textContent = "❚❚";
    } else {
      audio.pause();
      playBtn.textContent = "▶";
    }
  });

  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      fill.style.width = (audio.currentTime / audio.duration * 100) + "%";
      time.textContent = formatTime(audio.currentTime);
    }
  });

  audio.addEventListener("ended", () => {
    playBtn.textContent = "▶";
    fill.style.width = "0%";
    time.textContent = formatTime(audio.duration || 0);
  });

  audio.addEventListener("loadedmetadata", () => {
    time.textContent = formatTime(audio.duration || 0);
  });

  progressBar.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = audio.duration * pct;
  });
}

function resetAudio(letter) {
  const audio = document.getElementById("audio" + letter);
  audio.pause();
  audio.currentTime = 0;
  document.getElementById("play" + letter).textContent = "▶";
  document.getElementById("progressFill" + letter).style.width = "0%";
}

function formatTime(s) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

setupAudio("A");
setupAudio("B");

// ============================================================
// SELEZIONE VINCITORE
// ============================================================

async function handleSelection(key) {
  const winnerCard = key === "a" ? document.getElementById("cardA") : document.getElementById("cardB");
  const loserCard = key === "a" ? document.getElementById("cardB") : document.getElementById("cardA");

  winnerCard.classList.add("selected");
  loserCard.classList.add("eliminated");

  // Stoppa audio
  resetAudio("A");
  resetAudio("B");

  // Aspetta l'animazione
  await new Promise(r => setTimeout(r, 700));

  currentBracket = selectWinner(currentBracket, key);
  await saveBracket();

  if (currentBracket.completed) {
    window.location.href = "results.html";
  } else {
    renderCurrentMatch();
  }
}

document.getElementById("cardA").addEventListener("click", () => handleSelection("a"));
document.getElementById("cardB").addEventListener("click", () => handleSelection("b"));
