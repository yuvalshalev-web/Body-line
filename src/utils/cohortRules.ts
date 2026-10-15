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
