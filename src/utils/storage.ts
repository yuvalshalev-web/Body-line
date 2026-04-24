
/**
 * Helper for safe localStorage access in iframes (like AI Studio)
 * where localStorage might throw DOMException
 */
export const safeLocalStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.clear();
    } catch (e) {
      // ignore
    }
  }
};

/**
 * Helper for localStorage with expiration
 */
export const storage = {
  set: (key: string, data: any, expirationHours: number = 24) => {
    const now = new Date().getTime();
    const item = {
      data,
      timestamp: now,
      expiresAt: now + expirationHours * 60 * 60 * 1000,
    };
    safeLocalStorage.setItem(key, JSON.stringify(item));
  },

  get: (key: string) => {
    const itemStr = safeLocalStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();

      // Check if expired
      if (now > item.expiresAt) {
        safeLocalStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (e) {
      console.error(`Error parsing localStorage key "${key}":`, e);
      return null;
    }
  },

  remove: (key: string) => {
    safeLocalStorage.removeItem(key);
  },

  clear: () => {
    safeLocalStorage.clear();
  }
};
