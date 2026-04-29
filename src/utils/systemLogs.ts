
/**
 * System Logs Utility
 * Tracks frontend errors and system events.
 * Persists to localStorage for the current session.
 */

export type LogSeverity = 'Critical' | 'Warning' | 'Info' | 'Security';

export interface SystemLog {
  id: string;
  timestamp: Date;
  message: string;
  severity: LogSeverity;
  source: 'Frontend' | 'Cloud Function' | 'Database';
  details?: string;
}

const STORAGE_KEY = 'system_technical_logs';

const safeLocalStorage = {
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
      // Ignored
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // Ignored
    }
  }
};

export const addLog = (message: string, severity: LogSeverity = 'Info', source: SystemLog['source'] = 'Frontend', details?: string) => {
  if (typeof window === 'undefined') return;

  const newLog: SystemLog = {
    id: Math.random().toString(36).substring(2, 11),
    timestamp: new Date(),
    message,
    severity,
    source,
    details
  };

  const savedLogs = safeLocalStorage.getItem(STORAGE_KEY);
  let logs: SystemLog[] = [];

  if (savedLogs) {
    try {
      logs = JSON.parse(savedLogs);
      // Convert string timestamps back to Date objects
      logs = logs.map(log => ({ ...log, timestamp: new Date(log.timestamp) }));
    } catch (e) {
      console.error('Error parsing system logs', e);
    }
  }

  logs.unshift(newLog);
  // Keep only last 100 logs
  logs = logs.slice(0, 100);

  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('system-log-added', { detail: newLog }));
};

export const getLogs = (): SystemLog[] => {
  if (typeof window === 'undefined') return [];

  const savedLogs = safeLocalStorage.getItem(STORAGE_KEY);
  if (!savedLogs) return [];

  try {
    const logs = JSON.parse(savedLogs);
    return logs.map((log: any) => ({ ...log, timestamp: new Date(log.timestamp) }));
  } catch (e) {
    return [];
  }
};

export const clearLogs = () => {
  if (typeof window === 'undefined') return;
  safeLocalStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('system-log-added'));
};

// Global error listener
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    addLog(event.message, 'Critical', 'Frontend', event.filename + ':' + event.lineno);
  });

  window.addEventListener('unhandledrejection', (event) => {
    addLog('Unhandled Promise Rejection', 'Critical', 'Frontend', String(event.reason));
  });
}
