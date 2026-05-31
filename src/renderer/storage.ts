const STORAGE_KEYS = {
  STICKY_NOTES: 'mooday_sticky_notes',
  DAY_DATA: 'mooday_day_data',
  ACTIVE_STICKY_ID: 'mooday_active_sticky_id',
  THEME: 'mooday_theme',
};

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return defaultValue;
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

export const storageKeys = STORAGE_KEYS;
