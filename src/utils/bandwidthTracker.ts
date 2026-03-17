
/**
 * Bandwidth Tracker Utility
 * Tracks incoming and outgoing data in hourly buckets for the last 24 hours.
 * Persists to localStorage.
 */

interface BandwidthBucket {
  hour: string;
  in: number; // Bytes
  out: number; // Bytes
}

const STORAGE_KEY = 'site_bandwidth_stats';

export const trackBandwidth = (bytes: number, direction: 'in' | 'out') => {
  if (typeof window === 'undefined') return;

  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toDateString();
  
  const savedData = localStorage.getItem(STORAGE_KEY);
  let buckets: Record<string, BandwidthBucket> = {};
  
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      // Only keep data from today (or last 24h)
      // For simplicity, we'll just use the hour as the key and check the date
      if (parsed.date === today) {
        buckets = parsed.buckets || {};
      }
    } catch (e) {
      console.error('Error parsing bandwidth data', e);
    }
  }

  const hourKey = currentHour.toString();
  if (!buckets[hourKey]) {
    buckets[hourKey] = {
      hour: `${hourKey.padStart(2, '0')}:00`,
      in: 0,
      out: 0
    };
  }

  buckets[hourKey][direction] += bytes;

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: today,
    buckets
  }));

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('bandwidth-update', { 
    detail: { buckets, totalIn: buckets[hourKey].in, totalOut: buckets[hourKey].out } 
  }));
};

export const get24hBandwidth = () => {
  if (typeof window === 'undefined') return [];

  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) return generateEmptyBuckets();

  try {
    const parsed = JSON.parse(savedData);
    const today = new Date().toDateString();
    
    if (parsed.date !== today) return generateEmptyBuckets();
    
    const buckets = parsed.buckets || {};
    // Sort by hour to ensure correct chart display
    return Object.keys(buckets)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => ({
        time: buckets[key].hour,
        in: Math.round(buckets[key].in / 1024 / 1024 * 100) / 100, // MB
        out: Math.round(buckets[key].out / 1024 / 1024 * 100) / 100 // MB
      }));
  } catch (e) {
    return generateEmptyBuckets();
  }
};

const generateEmptyBuckets = () => {
  // Generate last 6 hours of empty data for a nice chart start
  const now = new Date();
  return Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getTime() - (5 - i) * 3600000);
    return {
      time: `${d.getHours().toString().padStart(2, '0')}:00`,
      in: 0,
      out: 0
    };
  });
};
