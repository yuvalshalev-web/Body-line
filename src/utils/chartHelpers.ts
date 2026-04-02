
import { Chart, registerables } from 'chart.js';

// Register Chart.js components if needed
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

import { parseDate } from './dateUtils';

/**
 * 1. Operational X-Axis Helper
 * Implements "Operational Relative Timeline" (Shnat Hevel Zug)
 * ONLY for the Trends & Retention Dashboard.
 */
export const getOperationalXAxisProps = (dataLength?: number, yearConfig?: { startDate: string; endDate: string } | null) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return {
    interval: (isMobile ? 'preserveStartEnd' : 0) as any,
    minTickGap: isMobile ? 0 : 5,
    tickFormatter: (value: any, index: number) => {
      if (!value) return '';
      
      // Normalize value: replace dots with slashes for consistent parsing
      const normalizedValue = String(value).replace(/\./g, '/');
      
      // 1. Mobile Logic: Start (DD.MM), Middle (אמצע), End (DD.MM)
      if (isMobile) {
        if (index === 0) return normalizedValue; // Start Date
        if (dataLength && index === Math.floor(dataLength / 2)) return 'אמצע';
        if (dataLength && index === dataLength - 1) return normalizedValue; // End Date
        return '';
      }

      // 2. Desktop Logic: Month Name (Month n)
      if (yearConfig && normalizedValue.includes('/')) {
        const parts = normalizedValue.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        
        const monthNames: Record<number, string> = {
          1: 'ינואר', 2: 'פברואר', 3: 'מרץ', 4: 'אפריל', 5: 'מאי', 6: 'יוני',
          7: 'יולי', 8: 'אוגוסט', 9: 'ספטמבר', 10: 'אוקטובר', 11: 'נובמבר', 12: 'דצמבר'
        };
        
        // Show label roughly once per month (around the 15th or if it's the first tick)
        if (day <= 15 || index === 0) {
          const start = parseDate(yearConfig.startDate) || new Date(0);
          start.setHours(0, 0, 0, 0);
          // Approximate month calculation
          const current = new Date(start.getFullYear(), month - 1, day);
          if (current < start) current.setFullYear(start.getFullYear() + 1);
          
          const diffMonths = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth()) + 1;
          return `${monthNames[month]} (${diffMonths})`;
        }
        return '';
      }

      return normalizedValue;
    },
    // UI/UX Styling
    tick: { fontSize: 10, fontWeight: 700, fill: '#4A5568' }, 
    axisLine: { stroke: '#E2E8F0', strokeWidth: 1 },
    tickLine: { stroke: '#E2E8F0' },
    height: 50,
    dy: 5,
    // Zero Padding / Max utilization
    padding: { left: 0, right: 0 }
  };
};

/**
 * 2. ApexCharts Global Defaults
 */
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Apex = {};
}
