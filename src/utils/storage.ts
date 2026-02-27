
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
    localStorage.setItem(key, JSON.stringify(item));
  },

  get: (key: string) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();

      // Check if expired
      if (now > item.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (e) {
      console.error(`Error parsing localStorage key "${key}":`, e);
      return null;
    }
  },

  remove: (key: string) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  }
};
