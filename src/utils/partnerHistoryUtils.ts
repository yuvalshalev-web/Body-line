import { Member, CommunityGroup, GroupMembership, PartnerHistoryItem } from '../types';

export interface EnrichedPartnerHistory {
  currentPartner: Member | null;
  currentCohortName: string;
  isAlumni: boolean;
  history: PartnerHistoryItem[];
  totalPartnersCount: number;
  roleDescription: string;
}

/**
 * Builds the comprehensive partner matrix and history for any member across all cohorts and years.
 * Follows the core rule:
 * - Active Cohort (שנת חבל זוג): 1-on-1 paired buddy between Volunteer and Participant (September to July).
 * - Alumni Group (קבוצת בוגרים): Homogeneous, no paired couples, ongoing year-round with summer hiatus.
 * - History: Preserves every buddy partnership across years. Volunteers accumulate multiple partners over the years.
 */
export function getMemberPartnerMatrix(
  member: Member | undefined,
  allMembers: Member[],
  groups: CommunityGroup[],
  memberships: GroupMembership[],
  currentCommunityId?: string
): EnrichedPartnerHistory {
  if (!member) {
    return {
      currentPartner: null,
      currentCohortName: '',
      isAlumni: false,
      history: [],
      totalPartnersCount: 0,
      roleDescription: ''
    };
  }

  const activeComm = currentCommunityId || 'herzliya';
  const isAlumniComm = activeComm.endsWith('_adults');

  // Check if member is in alumni group
  const alumniGroup = groups.find(g => g.type === 'alumni' || g.id === 'group_alumni');
  const isAlumni = isAlumniComm || memberships.some(m => 
    m.personId === member.id && 
    (m.groupId === 'group_alumni' || m.groupId === alumniGroup?.id)
  );

  // Active Cohort details
  const activeCohort = groups.find(g => g.isCurrentCohort) || 
    groups.find(g => g.type === 'cohort' && g.isActive) || 
    groups.find(g => g.id === 'cohort_active');
  const currentCohortName = activeCohort?.name || 'מחזור ז׳ (תשפ״ו 2025-2026)';

  // Current active partner - only valid if member has partnerId and is in an active cohort
  const currentPartner = (!isAlumniComm && member.partnerId) 
    ? allMembers.find(m => m.id === member.partnerId) || null 
    : null;

  // Build accumulated history list
  const historyMap = new Map<string, PartnerHistoryItem>();

  // 1. Explicit history stored on member document
  if (member.partnerHistory && Array.isArray(member.partnerHistory)) {
    for (const item of member.partnerHistory) {
      historyMap.set(`${item.cohortName}-${item.partnerId}`, item);
    }
  }

  // 2. If currently paired in active cohort, include current partnership as active
  if (currentPartner) {
    const isVol = member.role === 'Volunteer';
    const activeKey = `${currentCohortName}-${currentPartner.id}`;
    if (!historyMap.has(activeKey)) {
      historyMap.set(activeKey, {
        id: `pair-active-${member.id}-${currentPartner.id}`,
        partnerId: currentPartner.id,
        partnerName: `${currentPartner.firstName} ${currentPartner.lastName}`.trim(),
        partnerAvatar: currentPartner.avatar,
        partnerRole: (currentPartner.role === 'Volunteer' ? 'Volunteer' : 'Member'),
        cohortId: activeCohort?.id || 'cohort_active',
        cohortName: currentCohortName,
        communityId: activeComm,
        period: 'ספטמבר 2025 - יולי 2026',
        status: 'active',
        notes: isVol 
          ? `מתנדב מלווה את ${currentPartner.firstName}` 
          : `משתתף מלווה על ידי ${currentPartner.firstName}`
      });
    }
  }

  // 3. Reconstruct past cohort (מחזור ו׳ 2024-2025) if member participated in cohort_vav
  const memberMems = memberships.filter(m => m.personId === member.id);
  const hadPastVavCohort = memberMems.some(m => m.groupId === 'cohort_vav' && (m.status === 'completed' || m.status === 'graduated'));
  
  if (hadPastVavCohort) {
    const vavKey = `מחזור ו׳ (תשפ״ה 2024-2025)`;
    const alreadyHasVav = Array.from(historyMap.values()).some(h => h.cohortName.includes('מחזור ו'));
    
    if (!alreadyHasVav) {
      // Find past partner from members who also completed cohort_vav with opposite role
      // In the system, if currentPartner exists or partner was previously linked, identify counterpart
      let pastPartner: Member | null = null;
      if (member.partnerId) {
        pastPartner = allMembers.find(m => m.id === member.partnerId) || null;
      }
      
      if (pastPartner) {
        historyMap.set(`cohort_vav-${pastPartner.id}`, {
          id: `pair-vav-${member.id}-${pastPartner.id}`,
          partnerId: pastPartner.id,
          partnerName: `${pastPartner.firstName} ${pastPartner.lastName}`.trim(),
          partnerAvatar: pastPartner.avatar,
          partnerRole: (pastPartner.role === 'Volunteer' ? 'Volunteer' : 'Member'),
          cohortId: 'cohort_vav',
          cohortName: 'מחזור ו׳ (תשפ״ה 2024-2025)',
          communityId: 'herzliya',
          period: 'ספטמבר 2024 - יולי 2025',
          status: 'completed',
          notes: member.role === 'Volunteer' 
            ? `ליווה בהצלחה את ${pastPartner.firstName} במחזור ו׳` 
            : `לווה על ידי ${pastPartner.firstName} במחזור ו׳`
        });
      }
    }
  }

  const history = Array.from(historyMap.values()).sort((a, b) => {
    // Active first, then by cohort name descending
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return b.cohortName.localeCompare(a.cohortName, 'he');
  });

  const totalPartnersCount = history.length;
  const isVolunteer = member.role === 'Volunteer';
  
  let roleDescription = '';
  if (isVolunteer) {
    roleDescription = totalPartnersCount > 1 
      ? `ליווה ${totalPartnersCount} משתתפים לאורך השנים`
      : totalPartnersCount === 1 
      ? `מלווה משתתף אחד במחזור הפעילות`
      : `מתנדב מוכן לליווי שותף`;
  } else if (member.role === 'Member') {
    roleDescription = totalPartnersCount > 0 
      ? `לווה על ידי מתנדב אישי במחזור הפעילות`
      : `משתתף בקהילה`;
  } else {
    roleDescription = member.role === 'Admin' ? 'רכז קהילה' : member.role === 'Instructor' ? 'מדריך מוסמך' : 'צוות עמותה';
  }

  return {
    currentPartner,
    currentCohortName,
    isAlumni,
    history,
    totalPartnersCount,
    roleDescription
  };
}
