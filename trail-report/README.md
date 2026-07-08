# Trail Report

A personal training dashboard (trail running, mountain biking, climbing, strength, hiking) that installs to your iPhone home screen as an app. **All training data is stored locally on your device** — nothing is uploaded anywhere, and your data is never committed to this repo.

Built with React + Vite, deployed free via GitHub Pages, installable as a PWA.

---

## What you get
- Trends, Consistency, Records, Strength, and Log tabs
- Weekly/monthly volume, HR trend, run-pace efficiency, training effect, elevation, load, calories/sweat, cumulative progress, activity mix, bodyweight
- A **+ Add a session** button (with Strength Day A/B templates) that saves to your device
- Ramp-rate guardrail and this-week-vs-last comparison
- Export / import a JSON backup — the one file you own outright

---

## One-time setup (on your Mac)

You'll need [Node.js](https://nodejs.org) (LTS) and a GitHub account. Check Node is installed:

```bash
node --version   # should print v18 or newer
```

### 1. Create an empty repo on GitHub
Go to github.com → **New repository** → name it **`trail-report`** → **Public** → *don't* add a README (this project has one) → **Create repository**.

> Keep the name `trail-report`. If you use a different name, open `vite.config.js` and change `base: "/trail-report/"` to `base: "/YOUR-REPO-NAME/"`.

### 2. Put this project into the repo (from Terminal)

```bash
cd ~/Documents                        # or wherever you keep projects
# unzip the trail-report.zip here so you have a ~/Documents/trail-report folder
cd trail-report

git init
git add .
git commit -m "Initial commit — Trail Report"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/trail-report.git
git push -u origin main
```

### 3. Turn on GitHub Pages
In your repo on github.com → **Settings** → **Pages** → under **Build and deployment**, set **Source** to **GitHub Actions**. That's it — the included workflow builds and deploys automatically on every push.

Wait ~1–2 minutes. Your app will be live at:
```
https://YOUR-USERNAME.github.io/trail-report/
```

### 4. Install it on your iPhone
1. Open that URL in **Safari** on your iPhone.
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Launch it from the new icon. It opens full-screen like a native app and works offline.

---

## Run it locally on your Mac (optional, for testing/changes)

```bash
npm install     # first time only
npm run dev     # opens a local dev server, usually http://localhost:5173/trail-report/
```

Make changes, then to publish them:
```bash
git add .
git commit -m "describe your change"
git push
```
The site rebuilds and updates automatically. On your phone, close and reopen the app to get the new version.

---

## Your data
- Stored **only on your device** via IndexedDB (with a localStorage fallback).
- The seed history (through Jul 7, 2026) lives in `src/seedData.js` and loads once on first run; after that, your on-device copy is the source of truth.
- **Back it up:** Log tab → **Export backup (.json)**. Do this occasionally and keep the file somewhere safe (iCloud Drive, etc.). To move to a new phone or restore, use **Import backup**.
- Backup files are git-ignored so they never end up on GitHub.

---

## Notes & limits (honest)
- **No automatic Garmin sync.** You still add sessions by typing the numbers (from your Garmin screenshots). Auto-sync would require Garmin's API plus a small server — a separate future project.
- **No push notifications** (iOS limits PWAs here) — your existing Apple Reminders cover workout-day nudges.
- Clearing Safari website data for this site would erase the app's local data, so keep periodic JSON backups.

---

## Project structure
```
trail-report/
├─ index.html
├─ vite.config.js         # PWA config; `base` must match repo name
├─ package.json
├─ .github/workflows/     # auto-deploy to GitHub Pages
├─ public/                # icons, favicon
└─ src/
   ├─ main.jsx
   ├─ App.jsx             # the whole dashboard
   ├─ storage.js         # on-device storage layer
   └─ seedData.js        # your starting training history
```
