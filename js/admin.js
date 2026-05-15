// ============================================================
// ADMIN.JS - pannello amministratore
// ============================================================

import { requireAdmin, logoutUser } from "./auth.js";
import { db, storage } from "./firebase-config.js";
import {
  collection, query, where, orderBy, getDocs,
  doc, setDoc, updateDoc, deleteDoc,
  serverTimestamp, addDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getPersonalRanking, largestPowerOfTwo } from "./bracket.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

const navLinks = document.getElementById("navLinks");
let currentAdmin = null;
let assetDropZonesReady = false;

const FALLBACK_COVERS = [
  "assets/covers/song1.svg",
  "assets/covers/song2.svg"
];

requireAdmin(async (profile) => {
  currentAdmin = profile;
  navLinks.innerHTML = `
    <span style="color: var(--text-secondary); font-size: 0.85rem;">
      ◉ ${profile.username} <span class="badge badge-magenta">admin</span>
    </span>
    <a href="play.html">Gioca</a>
    <a href="rankings.html">Classifiche</a>
    <a href="#" id="logoutBtn">Esci</a>
  `;
  document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await logoutUser();
    window.location.href = "index.html";
  });

  setupTabs();
  setupAssetDropZones();
  await loadSongs();
  await loadActiveTournament();
});

// ============================================================
// TABS
// ============================================================

function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", async () => {
      const target = tab.dataset.tab;
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${target}`).classList.add("active");

      // Lazy load contenuti pesanti
      if (target === "stats") await loadGlobalStats();
      if (target === "users") await loadUserBrackets();
    });
  });
}

// ============================================================
// CANZONI - URL/static assets e lista
// ============================================================

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("uploadBtn");
  const alertBox = document.getElementById("uploadAlert");
  btn.disabled = true;
  btn.textContent = "Salvataggio...";
  alertBox.innerHTML = "";

  try {
    const title = document.getElementById("songTitle").value.trim();
    const artist = document.getElementById("songArtist").value.trim();
    const coverInputValue = document.getElementById("coverUrl").value.trim();
    const audioInputValue = document.getElementById("audioUrl").value.trim();

    if (!title || !artist) {
      throw new Error("Titolo e artista sono obbligatori");
    }

    if (!assetDropState.audioFile && !audioInputValue) {
      throw new Error("Carica un file audio oppure inserisci un link audio HTTPS");
    }

    // ID univoco
    const songId = `song_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    btn.textContent = "Upload audio...";
    const audioUrl = assetDropState.audioFile
      ? await uploadToFirebaseStorage(assetDropState.audioFile, `audio/${songId}-${safeStorageFileName(assetDropState.audioFile.name)}`)
      : normalizeAssetUrl(audioInputValue, "Audio");

    btn.textContent = "Upload copertina...";
    const coverUrl = assetDropState.coverFile
      ? await uploadToFirebaseStorage(assetDropState.coverFile, `covers/${songId}-${safeStorageFileName(assetDropState.coverFile.name)}`)
      : (coverInputValue ? normalizeAssetUrl(coverInputValue, "Copertina") : getFallbackCover(songId));

    btn.textContent = "Salvataggio database...";

    // Salva metadata in Firestore. Il file vero sta in Firebase Storage.
    await setDoc(doc(db, "songs", songId), {
      id: songId,
      title,
      artist,
      coverUrl,
      audioUrl,
      storageAudioPath: assetDropState.audioFile ? `audio/${songId}-${safeStorageFileName(assetDropState.audioFile.name)}` : "",
      storageCoverPath: assetDropState.coverFile ? `covers/${songId}-${safeStorageFileName(assetDropState.coverFile.name)}` : "",
      createdAt: serverTimestamp()
    });

    alertBox.innerHTML = `<div class="alert alert-success">Canzone aggiunta!</div>`;
    document.getElementById("uploadForm").reset();
    resetAssetDropZones();
    await loadSongs();
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Aggiungi canzone";
  }
});

async function loadSongs() {
  const snap = await getDocs(query(collection(db, "songs"), orderBy("createdAt", "desc")));
  const songs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  document.getElementById("songCount").textContent = songs.length;

  const list = document.getElementById("songsList");
  if (songs.length === 0) {
    list.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
      Nessuna canzone caricata.
    </p>`;
    return;
  }

  list.innerHTML = songs.map(s => `
    <div class="song-item" data-song-id="${s.id}">
      <img class="song-item-cover" src="${s.coverUrl}" alt="">
      <div class="song-item-info">
        <input class="title-input" value="${escapeAttr(s.title)}" data-field="title">
        <input class="artist-input" value="${escapeAttr(s.artist)}" data-field="artist">
      </div>
      <audio controls preload="none" style="height: 32px;">
        <source src="${s.audioUrl}" type="audio/mpeg">
      </audio>
      <button class="btn btn-danger" data-delete="${s.id}" style="padding: 0.5rem 0.875rem;">
        Elimina
      </button>
    </div>
  `).join("");

  // Salvataggio inline su blur
  list.querySelectorAll("input[data-field]").forEach(input => {
    input.addEventListener("blur", async () => {
      const songId = input.closest(".song-item").dataset.songId;
      const field = input.dataset.field;
      await updateDoc(doc(db, "songs", songId), { [field]: input.value.trim() });
    });
  });

  // Cancellazione
  list.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const songId = btn.dataset.delete;
      if (!confirm("Sicuro di voler eliminare questa canzone dal pool?")) return;
      btn.disabled = true;
      try {
        await deleteDoc(doc(db, "songs", songId));
        await loadSongs();
      } catch (err) {
        alert("Errore: " + err.message);
        btn.disabled = false;
      }
    });
  });
}

// ============================================================
// TORNEO - creazione e gestione
// ============================================================

async function loadActiveTournament() {
  const snap = await getDocs(query(
    collection(db, "tournaments"),
    where("status", "==", "active")
  ));

  const info = document.getElementById("activeTournamentInfo");
  if (snap.empty) {
    info.innerHTML = `<p style="color: var(--text-secondary);">Nessun torneo attivo.</p>`;
    return;
  }

  const t = { id: snap.docs[0].id, ...snap.docs[0].data() };
  info.innerHTML = `
    <p style="font-size: 1.15rem; font-weight: 600; margin-bottom: 0.5rem;">${escapeHtml(t.name)}</p>
    <p style="color: var(--text-secondary); margin-bottom: 1rem;">
      ${t.songs.length} canzoni · ${Math.log2(t.songs.length)} round
    </p>
    <button class="btn btn-danger" id="closeTournamentBtn">Chiudi torneo</button>
  `;

  document.getElementById("closeTournamentBtn").addEventListener("click", async () => {
    if (!confirm("Sei sicuro di voler chiudere il torneo? Nessuno potrà più giocarlo.")) return;
    await updateDoc(doc(db, "tournaments", t.id), {
      status: "closed",
      closedAt: serverTimestamp()
    });
    await loadActiveTournament();
  });
}

document.getElementById("createTournamentBtn").addEventListener("click", async () => {
  const alertBox = document.getElementById("tournamentAlert");
  alertBox.innerHTML = "";
  const name = document.getElementById("newTournamentName").value.trim() || "Torneo senza nome";

  try {
    // Verifica che non ci sia già un torneo attivo
    const activeSnap = await getDocs(query(
      collection(db, "tournaments"),
      where("status", "==", "active")
    ));
    if (!activeSnap.empty) {
      throw new Error("C'è già un torneo attivo. Chiudilo prima di crearne uno nuovo.");
    }

    // Carica le canzoni
    const songsSnap = await getDocs(collection(db, "songs"));
    let songs = songsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (songs.length < 2) {
      throw new Error("Servono almeno 2 canzoni nel pool");
    }

    // Tronca alla potenza di 2 più vicina
    const target = largestPowerOfTwo(songs.length);
    songs = songs.slice(0, target);

    // Estrai solo i campi necessari (denormalizzato per non dover rifare query in gioco)
    const tournamentSongs = songs.map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      coverUrl: s.coverUrl,
      audioUrl: s.audioUrl
    }));

    await addDoc(collection(db, "tournaments"), {
      name,
      status: "active",
      songs: tournamentSongs,
      createdAt: serverTimestamp(),
      createdBy: currentAdmin.uid
    });

    alertBox.innerHTML = `<div class="alert alert-success">
      Torneo "${escapeHtml(name)}" creato con ${target} canzoni!
    </div>`;
    document.getElementById("newTournamentName").value = "";
    await loadActiveTournament();
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
});

// ============================================================
// DRAG & DROP STATIC ASSETS
// ============================================================

const assetDropState = {
  coverObjectUrl: null,
  coverFile: null,
  audioFile: null
};

function setupAssetDropZones() {
  if (assetDropZonesReady) return;
  assetDropZonesReady = true;

  setupAssetDropZone({
    dropId: "coverDrop",
    fileInputId: "coverFileInput",
    pathInputId: "coverUrl",
    fileNameId: "coverFileName",
    previewId: "coverPreview",
    directory: "assets/covers/",
    fallbackLabel: "JPG, PNG, WEBP",
    kind: "cover"
  });

  setupAssetDropZone({
    dropId: "audioDrop",
    fileInputId: "audioFileInput",
    pathInputId: "audioUrl",
    fileNameId: "audioFileName",
    previewId: "audioPreview",
    directory: "assets/audio/",
    fallbackLabel: "MP3, WAV, M4A",
    kind: "audio"
  });
}

function setupAssetDropZone(config) {
  const drop = document.getElementById(config.dropId);
  const fileInput = document.getElementById(config.fileInputId);
  if (!drop || !fileInput) return;

  drop.addEventListener("click", () => fileInput.click());
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files?.[0]) handleAssetFile(fileInput.files[0], config);
  });

  ["dragenter", "dragover"].forEach(eventName => {
    drop.addEventListener(eventName, (e) => {
      e.preventDefault();
      drop.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    drop.addEventListener(eventName, () => {
      drop.classList.remove("dragover");
    });
  });

  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = [...(e.dataTransfer?.files || [])].find(f => isExpectedAssetType(f, config.kind));
    if (!file) {
      showAssetDropError(config.kind);
      return;
    }
    handleAssetFile(file, config);
  });
}

function handleAssetFile(file, config) {
  const pathInput = document.getElementById(config.pathInputId);
  const fileName = document.getElementById(config.fileNameId);
  const preview = document.getElementById(config.previewId);
  const drop = document.getElementById(config.dropId);

  pathInput.value = config.kind === "audio"
    ? `Firebase Storage → audio/${file.name}`
    : `Firebase Storage → covers/${file.name}`;
  fileName.textContent = file.name;
  drop.classList.add("has-file");

  if (config.kind === "cover") {
    assetDropState.coverFile = file;
    if (assetDropState.coverObjectUrl) URL.revokeObjectURL(assetDropState.coverObjectUrl);
    assetDropState.coverObjectUrl = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${assetDropState.coverObjectUrl}" alt="">`;
  } else {
    assetDropState.audioFile = file;
    preview.textContent = file.name.split(".").pop()?.slice(0, 4).toUpperCase() || "AUDIO";
  }

  const titleInput = document.getElementById("songTitle");
  if (config.kind === "audio" && !titleInput.value.trim()) {
    titleInput.value = titleFromFileName(file.name);
  }
}

function resetAssetDropZones() {
  resetAssetDropZone("coverDrop", "coverFileInput", "coverFileName", "coverPreview", "JPG, PNG, WEBP", "IMG");
  resetAssetDropZone("audioDrop", "audioFileInput", "audioFileName", "audioPreview", "MP3, WAV, M4A", "MP3");

  if (assetDropState.coverObjectUrl) {
    URL.revokeObjectURL(assetDropState.coverObjectUrl);
    assetDropState.coverObjectUrl = null;
  }

  assetDropState.coverFile = null;
  assetDropState.audioFile = null;
}

async function uploadToFirebaseStorage(file, path) {
  const storageRef = ref(storage, path);
  const metadata = { contentType: file.type || guessContentType(file.name) };
  await uploadBytes(storageRef, file, metadata);
  return await getDownloadURL(storageRef);
}

function safeStorageFileName(fileName) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function guessContentType(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "wav") return "audio/wav";
  if (ext === "m4a") return "audio/mp4";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function getFallbackCover(songId) {
  const n = Math.abs([...songId].reduce((acc, ch) => acc + ch.charCodeAt(0), 0));
  return FALLBACK_COVERS[n % FALLBACK_COVERS.length];
}
}

function resetAssetDropZone(dropId, fileInputId, fileNameId, previewId, fileNameText, previewText) {
  document.getElementById(dropId)?.classList.remove("has-file", "dragover");
  document.getElementById(fileInputId).value = "";
  document.getElementById(fileNameId).textContent = fileNameText;
  document.getElementById(previewId).textContent = previewText;
}

function isExpectedAssetType(file, kind) {
  const lowerName = file.name.toLowerCase();
  if (kind === "cover") {
    return file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(lowerName);
  }
  return file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(lowerName);
}

function showAssetDropError(kind) {
  const label = kind === "cover" ? "un'immagine" : "un file audio";
  document.getElementById("uploadAlert").innerHTML =
    `<div class="alert alert-error">Trascina ${label} valido.</div>`;
}

function titleFromFileName(fileName) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// ============================================================
// STATISTICHE GLOBALI - classifica aggregata
// ============================================================

async function loadGlobalStats() {
  // Trova torneo attivo
  const tSnap = await getDocs(query(
    collection(db, "tournaments"),
    where("status", "==", "active")
  ));
  if (tSnap.empty) {
    document.getElementById("globalRanking").innerHTML =
      `<p style="color: var(--text-secondary);">Nessun torneo attivo.</p>`;
    return;
  }
  const tournamentId = tSnap.docs[0].id;

  // Tutti i bracket completati per questo torneo
  const bSnap = await getDocs(query(
    collection(db, "brackets"),
    where("tournamentId", "==", tournamentId),
    where("bracket.completed", "==", true)
  ));

  const usersSnap = await getDocs(collection(db, "users"));
  const songsSnap = await getDocs(collection(db, "songs"));

  document.getElementById("statBrackets").textContent = bSnap.size;
  document.getElementById("statUsers").textContent = usersSnap.size;
  document.getElementById("statSongs").textContent = songsSnap.size;

  if (bSnap.empty) {
    document.getElementById("globalRanking").innerHTML =
      `<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
        Nessun bracket completato ancora.
      </p>`;
    return;
  }

  // Aggregazione: per ogni canzone, somma i punti accumulati su tutti gli utenti
  const songStats = new Map();

  bSnap.docs.forEach(d => {
    const bracket = d.data().bracket;
    const ranking = getPersonalRanking(bracket);
    ranking.forEach(entry => {
      const id = entry.song.id;
      if (!songStats.has(id)) {
        songStats.set(id, {
          song: entry.song,
          totalPoints: 0,
          appearances: 0,
          wins: 0
        });
      }
      const s = songStats.get(id);
      s.totalPoints += entry.points;
      s.appearances += 1;
      if (bracket.winner.id === id) s.wins += 1;
    });
  });

  const ranking = [...songStats.values()]
    .map(s => ({
      ...s,
      avgPoints: s.totalPoints / s.appearances
    }))
    .sort((a, b) => {
      if (b.avgPoints !== a.avgPoints) return b.avgPoints - a.avgPoints;
      return b.wins - a.wins;
    });

  document.getElementById("globalRanking").innerHTML = ranking.map((s, idx) => {
    const pos = idx + 1;
    const goldClass = pos === 1 ? "gold" : "";
    return `
      <div class="global-ranking-row ${goldClass}">
        <div style="font-size: 1.5rem; font-weight: 800; text-align: center; color: ${pos <= 3 ? 'var(--accent-yellow)' : 'var(--text-muted)'};">
          ${pos}
        </div>
        <img src="${s.song.coverUrl}" style="width: 60px; height: 60px; border-radius: 6px; object-fit: cover;" alt="">
        <div>
          <div style="font-weight: 600;">${escapeHtml(s.song.title)}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(s.song.artist)}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">PUNTI MEDI</div>
          <div style="font-weight: 700; color: var(--accent-cyan);">${s.avgPoints.toFixed(2)}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">VITTORIE</div>
          <div style="font-weight: 700; color: var(--accent-magenta);">${s.wins}/${s.appearances}</div>
        </div>
      </div>
    `;
  }).join("");
}

// ============================================================
// BRACKET DEI SINGOLI UTENTI
// ============================================================

async function loadUserBrackets() {
  const tSnap = await getDocs(query(
    collection(db, "tournaments"),
    where("status", "==", "active")
  ));
  if (tSnap.empty) {
    document.getElementById("userBrackets").innerHTML =
      `<p style="color: var(--text-secondary);">Nessun torneo attivo.</p>`;
    return;
  }
  const tournamentId = tSnap.docs[0].id;

  const bSnap = await getDocs(query(
    collection(db, "brackets"),
    where("tournamentId", "==", tournamentId)
  ));

  if (bSnap.empty) {
    document.getElementById("userBrackets").innerHTML =
      `<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
        Nessun utente ha ancora iniziato il torneo.
      </p>`;
    return;
  }

  const brackets = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  brackets.sort((a, b) => {
    if (a.bracket.completed !== b.bracket.completed) return a.bracket.completed ? -1 : 1;
    return 0;
  });

  document.getElementById("userBrackets").innerHTML = brackets.map(b => {
    const status = b.bracket.completed
      ? `<span class="badge badge-cyan">completato</span>`
      : `<span class="badge badge-magenta">in corso · ${b.bracket.currentRound + 1}/${b.bracket.totalRounds}</span>`;

    let winnerHtml = "";
    if (b.bracket.completed && b.bracket.winner) {
      winnerHtml = `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; margin-top: 0.75rem;">
          <img src="${b.bracket.winner.coverUrl}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;" alt="">
          <div style="min-width: 0;">
            <div style="font-size: 0.7rem; color: var(--accent-yellow); font-weight: 700; text-transform: uppercase;">★ Vincitrice</div>
            <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(b.bracket.winner.title)}</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="card" style="margin-bottom: 0.875rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 1rem;">◉ ${escapeHtml(b.username || 'utente sconosciuto')}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
              Bracket ${b.bracket.size} canzoni · ${b.likes || 0} like
            </div>
          </div>
          ${status}
        </div>
        ${winnerHtml}
      </div>
    `;
  }).join("");
}

// ============================================================
// HELPERS
// ============================================================

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s || "";
  return div.innerHTML;
}
function escapeAttr(s) {
  return (s || "").replace(/"/g, "&quot;");
}

function normalizeAssetUrl(value, label) {
  const raw = value.trim();
  if (!raw) return "";

  if (/^http:\/\//i.test(raw) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(raw)) {
    throw new Error(`${label}: usa HTTPS o un percorso relativo in assets/`);
  }

  if (/^https:\/\//i.test(raw) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../") || raw.startsWith("assets/")) {
    return raw;
  }

  throw new Error(`${label}: usa un URL HTTPS oppure un percorso tipo assets/audio/brano.mp3`);
}
