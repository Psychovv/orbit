import { AppState } from '../types';
import { INITIAL_STATE } from '../data/seedData';

const STORAGE_KEY = 'orbit_state';
const DB_NAME = 'OrbitDatabase';
const STORE_NAME = 'orbit_store';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function saveStateToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save state to localStorage', err);
  }

  // Asynchronously save to IndexedDB as an extra safety layer
  openIndexedDB()
    .then((db) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(state, 'current_state');
    })
    .catch(() => {
      // Ignore background IDB errors silently
    });
}

export function loadStateFromStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        ...INITIAL_STATE,
        ...parsed,
        // Ensure sub-collections are preserved if user added new areas/goals
        areas: parsed.areas && parsed.areas.length > 0 ? parsed.areas : INITIAL_STATE.areas,
        schedule: parsed.schedule || INITIAL_STATE.schedule,
        goals: parsed.goals || INITIAL_STATE.goals,
        streaks: parsed.streaks || INITIAL_STATE.streaks,
        completionHistory: parsed.completionHistory || INITIAL_STATE.completionHistory
      };
    }
  } catch (err) {
    console.error('Error reading localStorage, using initial state', err);
  }
  return INITIAL_STATE;
}

export function exportStateAsJSON(state: AppState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `orbit-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.setAttribute('data-theme', theme);
}
