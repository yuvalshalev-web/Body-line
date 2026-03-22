
export interface MeteorologicalData {
  waveHeight: number; // in cm
  windSpeed: number; // in knots or km/h
  windDir: string; // 'SW', 'E', 'W', 'N', 'S', 'NE', 'NW', 'SE'
  period: number; // in seconds
  lastRain?: boolean;
}

export interface TrackerData {
  trackerId: string;
  refreshRate: string;
  content: {
    scrollingText: string;
    severity: 'High' | 'Medium' | 'Low';
    lastFetch: string;
  };
}

/**
 * Analyzes Israel surf conditions based on meteorological data and returns alerts.
 */
export const analyzeIsraelSurfConditions = (data: MeteorologicalData): TrackerData => {
  const alerts: string[] = [];
  let severity: 'High' | 'Medium' | 'Low' = 'Low';

  // 1. Washing Machine Effect (גובה ותקופה)
  if (data.waveHeight > 120 && data.period < 5) {
    alerts.push("⚠️ ים 'קצר' וצפוף (Short Swell) - תנאי מכונת כביסה, חתירה מאתגרת מאוד.");
    severity = 'Medium';
  }

  // 2. Rip Currents (זרמי פריצה)
  if (data.waveHeight > 150) {
    alerts.push("🚨 אזהרת בטיחות: זרמי פריצה (Rips) בשיא העוצמה - סכנת היסחפות לעומק בחופים פתוחים.");
    severity = 'High';
  }

  // 3. Longshore Drift (סחף צדי)
  if (data.windDir === 'SW' && data.windSpeed > 15) {
    alerts.push("🌬️ סחף צפוני חזק מאוד - הישמרו מהיצמדות לצד הדרומי של שוברי גלים.");
    if (severity !== 'High') severity = 'Medium';
  }

  // 4. Offshore Danger (רוח מזרחית)
  if (data.windDir === 'E' && data.windSpeed > 18) {
    alerts.push("🚩 זהירות: רוח מזרחית חזקה מקשה על כניסה לגל ועלולה לסחוף גולשים לעומק.");
    severity = 'High';
  }

  // 5. Pollution (עכירות וזיהום)
  if (data.lastRain) {
    alerts.push("⛈️ חשש לעכירות מים וזיהום נגר עירוני - ראות לקויה וסכנה בריאותית.");
    if (severity === 'Low') severity = 'Medium';
  }

  const scrollingText = alerts.length > 0 
    ? alerts.join(' 🏄 ')
    : "תנאי הים יציבים כרגע. גלישה מהנה!";

  return {
    trackerId: "il-surf-live-01",
    refreshRate: "600s",
    content: {
      scrollingText: `[LIVE UPDATE] ${scrollingText}`,
      severity,
      lastFetch: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    }
  };
};
