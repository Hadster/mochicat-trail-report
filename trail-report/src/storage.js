// Local, on-device storage for Trail Report.
// Your training data lives here — in the browser/PWA on your phone — and is
// NEVER sent anywhere or committed to the repo. Uses IndexedDB, with a
// localStorage fallback if IndexedDB is unavailable.

const DB_NAME = "trail-report";
const STORE = "kv";
const VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("no-idb"));
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// Public API — always resolves, falling back to localStorage, then memory.
const mem = {};

export async function storageGet(key) {
  try { const v = await idbGet(key); if (v !== null) return v; } catch (_) {}
  try { const v = localStorage.getItem(key); if (v !== null) return JSON.parse(v); } catch (_) {}
  return key in mem ? mem[key] : null;
}

export async function storageSet(key, value) {
  mem[key] = value;
  let ok = false;
  try { await idbSet(key, value); ok = true; } catch (_) {}
  try { localStorage.setItem(key, JSON.stringify(value)); ok = true; } catch (_) {}
  return ok;
}

// Request persistent storage so the OS won't evict your data under pressure.
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
  } catch (_) {}
  return false;
}
