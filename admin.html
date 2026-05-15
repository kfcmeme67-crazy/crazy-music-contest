// ============================================================
// BRACKET LOGIC - generazione e gestione del torneo a eliminazione
// ============================================================

/**
 * Verifica se un numero è potenza di 2.
 */
export function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Restituisce la più grande potenza di 2 minore o uguale a n.
 * Es: 30 -> 16, 7 -> 4, 16 -> 16
 */
export function largestPowerOfTwo(n) {
  let p = 1;
  while (p * 2 <= n) p *= 2;
  return p;
}

/**
 * Mescola un array (Fisher-Yates). Non muta l'originale.
 * Accetta un seed deterministico opzionale per debug.
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Genera il bracket iniziale dato un array di canzoni.
 * Le canzoni vengono accoppiate in ordine: [0,1], [2,3], [4,5]...
 * Il numero di canzoni DEVE essere potenza di 2.
 *
 * Restituisce un oggetto bracket con questa struttura:
 * {
 *   size: 8,                          // numero canzoni
 *   totalRounds: 3,                   // round totali (log2 size)
 *   currentRound: 0,                  // round attivo
 *   currentMatchIndex: 0,             // match attivo nel round
 *   rounds: [
 *     [ {a, b, winner: null}, {a, b, winner: null}, ... ],  // primo round
 *     [ {a: null, b: null, winner: null}, ... ],            // semifinali
 *     [ {a: null, b: null, winner: null} ]                  // finale
 *   ],
 *   winner: null,                     // canzone vincitrice
 *   completed: false
 * }
 */
export function createBracket(songs) {
  if (!isPowerOfTwo(songs.length)) {
    throw new Error(`Servono potenze di 2 canzoni, ricevute ${songs.length}`);
  }

  const totalRounds = Math.log2(songs.length);
  const rounds = [];

  // Primo round: accoppia le canzoni
  const firstRound = [];
  for (let i = 0; i < songs.length; i += 2) {
    firstRound.push({
      a: songs[i],
      b: songs[i + 1],
      winner: null
    });
  }
  rounds.push(firstRound);

  // Round successivi: match vuoti, verranno riempiti
  let matchCount = firstRound.length / 2;
  for (let r = 1; r < totalRounds; r++) {
    const round = [];
    for (let i = 0; i < matchCount; i++) {
      round.push({ a: null, b: null, winner: null });
    }
    rounds.push(round);
    matchCount = matchCount / 2;
  }

  return {
    size: songs.length,
    totalRounds,
    currentRound: 0,
    currentMatchIndex: 0,
    rounds,
    winner: null,
    completed: false
  };
}

/**
 * Registra la scelta dell'utente nel match corrente e fa avanzare il bracket.
 * winnerKey: "a" oppure "b"
 *
 * Restituisce il nuovo stato (immutabile rispetto all'originale).
 */
export function selectWinner(bracket, winnerKey) {
  if (bracket.completed) return bracket;
  if (winnerKey !== "a" && winnerKey !== "b") {
    throw new Error("winnerKey deve essere 'a' o 'b'");
  }

  // Deep clone per immutabilità
  const newBracket = JSON.parse(JSON.stringify(bracket));
  const { currentRound, currentMatchIndex } = newBracket;
  const match = newBracket.rounds[currentRound][currentMatchIndex];
  const winner = match[winnerKey];

  match.winner = winner;
  match.winnerKey = winnerKey;

  // Se NON è l'ultimo round, propaga il vincitore al round successivo
  if (currentRound < newBracket.totalRounds - 1) {
    const nextMatchIdx = Math.floor(currentMatchIndex / 2);
    const nextSlot = currentMatchIndex % 2 === 0 ? "a" : "b";
    newBracket.rounds[currentRound + 1][nextMatchIdx][nextSlot] = winner;
  }

  // Avanza al prossimo match
  const isLastMatchInRound = currentMatchIndex === newBracket.rounds[currentRound].length - 1;
  const isLastRound = currentRound === newBracket.totalRounds - 1;

  if (isLastRound && isLastMatchInRound) {
    // Torneo finito
    newBracket.completed = true;
    newBracket.winner = winner;
  } else if (isLastMatchInRound) {
    // Round finito, passa al prossimo
    newBracket.currentRound++;
    newBracket.currentMatchIndex = 0;
  } else {
    // Stesso round, prossimo match
    newBracket.currentMatchIndex++;
  }

  return newBracket;
}

/**
 * Restituisce il match correntemente da giocare, o null se finito.
 */
export function getCurrentMatch(bracket) {
  if (bracket.completed) return null;
  return bracket.rounds[bracket.currentRound][bracket.currentMatchIndex];
}

/**
 * Calcola progresso percentuale (per progress bar).
 */
export function getProgress(bracket) {
  const totalMatches = bracket.size - 1; // un torneo da N canzoni ha N-1 match
  let played = 0;
  for (const round of bracket.rounds) {
    for (const m of round) {
      if (m.winner) played++;
    }
  }
  return Math.round((played / totalMatches) * 100);
}

/**
 * Restituisce il nome leggibile del round corrente.
 */
export function getRoundName(bracket) {
  const remaining = bracket.totalRounds - bracket.currentRound;
  switch (remaining) {
    case 1: return "Finale";
    case 2: return "Semifinale";
    case 3: return "Quarti di finale";
    case 4: return "Ottavi di finale";
    case 5: return "Sedicesimi";
    default: return `Round ${bracket.currentRound + 1}`;
  }
}

/**
 * Estrae il ranking personale dell'utente da un bracket completato.
 * Sistema di scoring per round vinto:
 *   - 1° posto (vince finale): punti = totalRounds
 *   - finaliste: punti = totalRounds - 1
 *   - semifinaliste: punti = totalRounds - 2
 *   ... e così via
 *
 * Restituisce: [{ songId, songData, points, eliminatedAt }, ...] ordinato per punti decrescenti
 */
export function getPersonalRanking(bracket) {
  const ranking = new Map();

  // Inizializza tutte le canzoni del primo round
  for (const match of bracket.rounds[0]) {
    if (match.a) ranking.set(match.a.id, { song: match.a, points: 0, eliminatedAt: 0 });
    if (match.b) ranking.set(match.b.id, { song: match.b, points: 0, eliminatedAt: 0 });
  }

  // Per ogni round, chi VINCE ottiene (round+1) punti e avanza
  for (let r = 0; r < bracket.rounds.length; r++) {
    for (const match of bracket.rounds[r]) {
      if (match.winner) {
        const entry = ranking.get(match.winner.id);
        if (entry) {
          entry.points = r + 1;
          entry.eliminatedAt = r + 1; // se vince anche il prossimo, verrà sovrascritto
        }
      }
    }
  }

  // Il vincitore finale ha eliminatedAt = totalRounds + 1 (mai eliminato)
  if (bracket.winner) {
    const winnerEntry = ranking.get(bracket.winner.id);
    if (winnerEntry) winnerEntry.eliminatedAt = bracket.totalRounds + 1;
  }

  return [...ranking.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.eliminatedAt - a.eliminatedAt;
  });
}
