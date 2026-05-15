# Song Tournament

Torneo a eliminazione diretta in cui gli utenti scelgono la canzone migliore round dopo round. Il sito e' statico, usa Firebase solo per login, Firestore e dati del torneo, ed e' pronto per GitHub Pages.

## Obiettivo: hosting gratis senza carta

Percorso consigliato:

- Hosting statico: GitHub Pages, su repository pubblico GitHub Free.
- Backend dati: Firebase Spark, senza collegare un account di fatturazione.
- File audio/copertine: file statici in `assets/audio/` e `assets/covers/`, oppure URL HTTPS esterni gia' pubblici.

Non usare Firebase Cloud Storage se vuoi evitare dati di pagamento: per i nuovi progetti Firebase Storage richiede il piano Blaze/pay-as-you-go.

## Struttura

```text
.
|-- index.html
|-- login.html
|-- register.html
|-- play.html
|-- results.html
|-- rankings.html
|-- admin.html
|-- css/
|-- js/
|-- assets/
|   |-- audio/
|   `-- covers/
|-- firestore.rules
|-- .nojekyll
`-- .github/workflows/deploy-pages.yml
```

## Setup Firebase Spark

1. Vai su `https://console.firebase.google.com`.
2. Crea un progetto sul piano Spark. Non collegare billing e non passare a Blaze.
3. Aggiungi un'app Web con icona `</>`.
4. Copia l'oggetto `firebaseConfig` in `js/firebase-config.js`.
5. Abilita Authentication con provider Email/Password.
6. Crea Firestore Database.
7. In Firestore -> Rules, incolla il contenuto di `firestore.rules` e pubblica.

Non abilitare Firebase Storage per questa configurazione no-card.

## Deploy gratis con GitHub Pages

1. Crea un repository pubblico su GitHub.
2. Carica/pusha questi file nel branch `main` o `master`.
3. Su GitHub vai in Settings -> Pages.
4. In "Build and deployment", scegli "GitHub Actions".
5. La workflow `.github/workflows/deploy-pages.yml` pubblichera' il sito a ogni push.
6. Il sito sara' disponibile su `https://TUO-UTENTE.github.io/NOME-REPO/`.

Dopo il primo deploy, aggiungi il dominio GitHub Pages in Firebase:

```text
Firebase Console -> Authentication -> Settings -> Authorized domains
```

Aggiungi:

```text
TUO-UTENTE.github.io
```

## Come aggiungere canzoni senza Storage

Metodo piu' semplice:

1. Metti gli MP3 in `assets/audio/`.
2. Metti le copertine in `assets/covers/`.
3. Pusha su GitHub.
4. Entra nel pannello admin e inserisci percorsi relativi come:

```text
assets/audio/nome-brano.mp3
assets/covers/nome-copertina.jpg
```

Puoi anche usare URL HTTPS pubblici, per esempio da un altro servizio che gia' ospita i file. Evita URL `http://` perche' su GitHub Pages, che usa HTTPS, il browser puo' bloccarli come contenuto misto.

## Uso admin

1. Registrati con username `admin`, oppure imposta `isAdmin: true` manualmente nel documento utente Firestore.
2. Vai su `admin.html`.
3. Aggiungi canzoni con titolo, artista, URL copertina e URL audio.
4. Crea un torneo attivo dalla tab Torneo.

## Limiti da sapere

- GitHub Pages ospita solo file statici: niente upload runtime dal browser.
- Se vuoi upload audio dal pannello admin direttamente nel sito, serve un servizio di storage. Firebase Cloud Storage oggi richiede Blaze, quindi carta/billing.
- Con Spark, se superi le quote Firebase gratuite, il servizio si ferma invece di fatturare.

## Sviluppo locale

Apri il sito tramite un piccolo server statico, perche' i moduli JavaScript ES non funzionano sempre bene con `file://`:

```powershell
python -m http.server 8090
```

Poi visita:

```text
http://127.0.0.1:8090/
```
