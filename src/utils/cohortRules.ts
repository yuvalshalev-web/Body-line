import { CommunityGroup, GroupMembership, GroupMemberRole, MembershipStatus, Member } from '../types';

export const GROUP_ROLE_LABELS: Record<GroupMemberRole, string> = {
  participant: 'משתתף',
  volunteer: 'מתנדב',
  instructor: 'מדריך',
  coordinator: 'רכז',
  staff: 'צוות עמותה'
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: 'פעיל',
  completed: 'סיים מחזור',
  graduated: 'בוגר',
  paused: 'מושהה'
};

export const GROUP_TYPE_LABELS: Record<string, string> = {
  cohort: 'מחזור פעילות (שנת חבל זוג)',
  alumni: 'קבוצת בוגרים',
  special: 'קבוצה מיוחדת'
};

/**
 * Checks if a person is eligible to join the Alumni Group (קבוצת בוגרים).
 * Rule:
 * 1. Staff, coordinators, instructors, and app-shapers are ALWAYS eligible without restriction.
 * 2. Participants and volunteers MUST have completed a cohort that has ended.
 */
export function checkAlumniEligibility(
  personId: string,
  member: Member | undefined,
  memberships: GroupMembership[],
  groups: CommunityGroup[]
): { eligible: boolean; reason: string } {
  if (!member) {
    return { eligible: false, reason: 'משתמש לא נמצא' };
  }

  // Staff, Coordinators, Instructors, App-Shaper can join any group without restriction
  const isPrivileged = 
    member.role === 'Admin' || 
    member.role === 'Staff' || 
    member.role === 'Instructor' || 
    member.role === 'Support' ||
    (member.email || '').toLowerCase() === 'yuval.shalev@gmail.com';

  if (isPrivileged) {
    return { 
      eligible: true, 
      reason: 'אנשי צוות, רכזים, מדריכים ואפ-שייפר רשאים להשתתף בכל קבוצה ללא הגבלה ובמקביל' 
    };
  }

  // Look for completed past cohort participation
  const pastCohortMembership = memberships.find(m => {
    if (m.personId !== personId) return false;
    const group = groups.find(g => g.id === m.groupId);
    const isCohort = group?.type === 'cohort';
    const isPastOrCompleted = (!group?.isActive) || m.status === 'completed' || m.status === 'graduated';
    const isRelevantRole = m.role === 'participant' || m.role === 'volunteer';
    return isCohort && isPastOrCompleted && isRelevantRole;
  });

  if (pastCohortMembership) {
    return { 
      eligible: true, 
      reason: 'זכאי - השלים השתתפות במחזור שהסתיים' 
    };
  }

  return { 
    eligible: false, 
    reason: 'התנאי להשתתפות בקבוצת בוגרים עבור משתתפים ומתנדבים הוא סיום והשלמת מחזור פעילות קודם' 
  };
}

/**
 * Checks if a participant who finished a cohort can become a volunteer in the next cohort.
 */
export function canBecomeVolunteerInNextCohort(
  personId: string,
  memberships: GroupMembership[],
  groups: CommunityGroup[]
): boolean {
  return memberships.some(m => {
    if (m.personId !== personId) return false;
    const group = groups.find(g => g.id === m.groupId);
    return group?.type === 'cohort' && (m.status === 'completed' || m.status === 'graduated' || !group?.isActive);
  });
}

/**
 * Returns all active group memberships for a specific member with group details
 */
export function getMemberGroupAffiliations(
  personId: string,
  memberships: GroupMembership[],
  groups: CommunityGroup[]
) {
  const memberAffiliations = memberships.filter(m => m.personId === personId);
  return memberAffiliations.map(m => {
    const group = groups.find(g => g.id === m.groupId);
    return {
      membership: m,
      group: group || {
        id: m.groupId,
        name: 'קבוצה לא ידועה',
        type: 'cohort' as const,
        isActive: false,
        createdAt: ''
      },
      roleLabel: GROUP_ROLE_LABELS[m.role] || m.role,
      statusLabel: MEMBERSHIP_STATUS_LABELS[m.status] || m.status
    };
  });
}

/**
 * Calculates the number of distinct cohorts a member participated in.
 */
export function getMemberCohortCount(
  member: Member | undefined,
  memberships: GroupMembership[],
  groups: CommunityGroup[]
): number {
  if (!member) return 0;
  
  const memberMems = memberships.filter(m => m.personId === member.id);
  const cohortIds = new Set<string>();

  for (const m of memberMems) {
    const grp = groups.find(g => g.id === m.groupId);
    if (m.groupId.startsWith('cohort_') || grp?.type === 'cohort') {
      cohortIds.add(m.groupId);
    }
  }

  // If member belongs to active communities (e.g. herzliya, ashdod, etc.), they belong to the current active cohort
  const hasActiveCohortComm = (member.communities || []).some(c => !c.endsWith('_adults'));
  if (hasActiveCohortComm) {
    cohortIds.add('cohort_active');
  }

  // If member has alumni membership or is in an adults community, ensure at least one past cohort is counted
  const hasAlumni = memberMems.some(m => {
    const grp = groups.find(g => g.id === m.groupId);
    return m.groupId === 'group_alumni' || grp?.type === 'alumni';
  }) || (member.communities || []).some(c => c.endsWith('_adults'));

  if (hasAlumni && cohortIds.size === 0) {
    cohortIds.add('past_cohort_alumni');
  }

  return Math.max(1, cohortIds.size);
}

/**
 * Formats a join date to DD/MM/YYYY nicely.
 */
export function formatJoinDate(rawDate?: string | any): string {
  if (!rawDate) return '';
  if (typeof rawDate === 'string') {
    const clean = rawDate.trim();
    // Matches DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
    const dottedMatch = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dottedMatch) {
      const day = dottedMatch[1].padStart(2, '0');
      const month = dottedMatch[2].padStart(2, '0');
      const year = dottedMatch[3];
      return `${day}/${month}/${year}`;
    }
    // If it's ISO like 2026-03-30T...
    if (clean.includes('T') || clean.includes('-')) {
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
  }
  return '';
}
