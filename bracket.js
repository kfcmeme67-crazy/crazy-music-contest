/* ============================================================
   CRAZY_MUSIC Tournament - SoundCloud-inspired dark music platform theme
   ============================================================ */

:root {
  --bg-primary: #0d0d0f;
  --bg-secondary: #151518;
  --bg-tertiary: #202024;
  --bg-card: #18181c;
  --border: #303035;
  --border-hover: #ff6a22;

  --text-primary: #f6f6f6;
  --text-secondary: #b7b7bd;
  --text-muted: #777780;

  --accent-cyan: #ff5500;
  --accent-magenta: #ff7a18;
  --accent-violet: #f6f6f6;
  --accent-yellow: #ffb000;

  --success: #12805c;
  --danger: #d92345;
  --warning: #ff8a00;

  --glow-cyan: 0 10px 26px rgba(255, 85, 0, 0.22);
  --glow-magenta: 0 10px 26px rgba(255, 122, 24, 0.22);
  --glow-violet: 0 10px 26px rgba(255, 255, 255, 0.08);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}

body {
  background-image:
    radial-gradient(circle at 24% 8%, rgba(255, 85, 0, 0.24) 0, transparent 34%),
    radial-gradient(circle at 82% 18%, rgba(255, 122, 24, 0.12) 0, transparent 30%),
    linear-gradient(180deg, #171717 0, #0d0d0f 48%, #09090a 100%);
  background-attachment: fixed;
}

/* SOTTILE TEXTURE TIPO WAVEFORM */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    repeating-linear-gradient(90deg, rgba(255, 85, 0, 0.08) 0 2px, transparent 2px 14px),
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 100% 180px, 100% 48px;
  background-position: 0 120px, 0 0;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent 55%);
  pointer-events: none;
  z-index: 0;
}

/* TIPOGRAFIA */
h1, h2, h3, h4 {
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

h1 {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #ffffff, var(--accent-cyan) 62%, var(--accent-magenta));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
}

h2 { font-size: 1.75rem; color: var(--text-primary); }
h3 { font-size: 1.25rem; color: var(--text-primary); }

/* LAYOUT BASE */
.container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #0b0b0d;
  border-bottom: 3px solid var(--accent-cyan);
  padding: 0.85rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.18);
}

.navbar .logo {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--accent-cyan), #ff9a2f);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-decoration: none;
}

.navbar nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.navbar nav a {
  color: #d6d6d6;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

.navbar nav a:hover {
  color: #ffffff;
}

.navbar nav .btn-secondary {
  background: transparent;
  border-color: #4a4a4a;
  color: #ffffff;
  padding: 0.5rem 1rem;
}

.navbar nav .btn-secondary:hover {
  background: var(--accent-cyan);
  border-color: var(--accent-cyan);
  color: #ffffff;
}

/* CARD */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1.5rem;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.card:hover {
  border-color: var(--border-hover);
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.28);
}

.soundcloud-profile-card {
  background:
    linear-gradient(135deg, rgba(255, 85, 0, 0.12), rgba(255, 122, 24, 0.04)),
    var(--bg-card);
}

.track-reference-row {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 0.75rem;
  align-items: center;
  padding: 0.7rem 0.8rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.track-reference-row span {
  color: var(--accent-cyan);
  font-size: 0.78rem;
  font-weight: 800;
}

.track-reference-row strong {
  color: var(--text-primary);
  font-size: 0.92rem;
}

/* BOTTONI */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.95rem;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-primary);
}

.btn-primary {
  background: linear-gradient(180deg, #ff7a18, var(--accent-cyan));
  color: #ffffff;
  font-weight: 700;
  box-shadow: var(--glow-cyan);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(255, 85, 0, 0.28);
}

.btn-secondary {
  background: #202024;
  border-color: var(--border);
  color: var(--text-primary);
}

.btn-secondary:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.btn-danger {
  background: transparent;
  border-color: var(--danger);
  color: var(--danger);
}

.btn-danger:hover {
  background: var(--danger);
  color: #fff;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* INPUT */
.input, input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="url"] {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #111114;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus, input:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(255, 85, 0, 0.14);
}

.label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.form-group {
  margin-bottom: 1.25rem;
}

/* ALERT */
.alert {
  padding: 0.875rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  border-left: 3px solid;
}

.alert-error {
  background: rgba(217, 35, 69, 0.1);
  border-color: var(--danger);
  color: #ff7090;
}

.alert-success {
  background: rgba(18, 128, 92, 0.1);
  border-color: var(--success);
  color: var(--success);
}

.alert-info {
  background: rgba(255, 85, 0, 0.1);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

/* LOADING SPINNER */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 2rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* UTILITY */
.hidden { display: none !important; }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.mt-1 { margin-top: 1rem; }
.mt-2 { margin-top: 2rem; }
.mb-1 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 2rem; }

.badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-cyan {
  background: rgba(255, 85, 0, 0.12);
  color: var(--accent-cyan);
  border: 1px solid rgba(255, 85, 0, 0.3);
}

.badge-magenta {
  background: rgba(255, 122, 24, 0.12);
  color: var(--accent-magenta);
  border: 1px solid rgba(255, 122, 24, 0.35);
}

/* RESPONSIVE */
@media (max-width: 640px) {
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.35rem; }
  .container { padding: 1.5rem 1rem; }
  .navbar {
    padding: 0.875rem 1rem;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .navbar nav {
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .soundcloud-profile-card {
    grid-template-columns: 1fr !important;
  }
}
