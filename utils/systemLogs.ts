
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

export const addLog = (message: string, severity: LogSeverity = 'Info', source: SystemLog['source'] = 'Frontend', details?: string) => {
  if (typeof window === 'undefined') return;

  const newLog: SystemLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    message,
    severity,
    source,
    details
  };

  const savedLogs = localStorage.getItem(STORAGE_KEY);
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('system-log-added', { detail: newLog }));
};

export const getLogs = (): SystemLog[] => {
  if (typeof window === 'undefined') return [];

  const savedLogs = localStorage.getItem(STORAGE_KEY);
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
  localStorage.removeItem(STORAGE_KEY);
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
