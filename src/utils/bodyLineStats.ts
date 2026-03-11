import { Member } from '../../types';

/**
 * Body-Line Dynamic Context & Stats Helper
 * This function provides core logic for calculating statistics based on active members.
 */
export const getBodyLineStats = (allMembers: Member[]) => {
  // Filter for active members. Exclude suspended or left members.
  const activeMembers = allMembers.filter(m => 
    m.isActive !== false && 
    (m as any).status !== 'suspended' && 
    (m as any).status !== 'left'
  );
  const n = activeMembers.length;

  const getValuesArray = (property: string) => 
    activeMembers.map(m => (m as any)[property]).filter(v => typeof v === 'number');

  return {
    activeMembers,
    count: n,
    
    /**
     * Calculates the relative percentile (0-100) for a member's value.
     */
    calculatePercentile: (memberValue: number, property: string): string => {
      if (n <= 1) return "100.0";
      const values = getValuesArray(property).sort((a, b) => a - b);
      const rank = values.indexOf(memberValue);
      if (rank === -1) return "0.0";
      return ((rank / (n - 1)) * 100).toFixed(1);
    },
    
    /**
     * Calculates the rank (1, 2, 3...) for a member's value.
     */
    getRank: (memberValue: any, property: string, reverse = false): number => {
      const values = getValuesArray(property).sort((a, b) => reverse ? a - b : b - a);
      const rank = values.indexOf(memberValue);
      return rank === -1 ? n : rank + 1;
    },

    /**
     * Calculates the average for a property.
     */
    getAverage: (property: string): number => {
      const values = getValuesArray(property);
      if (values.length === 0) return 0;
      const sum = values.reduce((a, b) => a + b, 0);
      return sum / values.length;
    }
  };
};
