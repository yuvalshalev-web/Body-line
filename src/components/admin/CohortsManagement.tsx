import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Calendar, 
  Users, 
  Award, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Search, 
  UserPlus, 
  Compass, 
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { 
  CommunityGroup, 
  GroupMembership, 
  GroupMemberRole, 
  Member 
} from '../../types';
import { 
  GROUP_ROLE_LABELS, 
  MEMBERSHIP_STATUS_LABELS, 
  checkAlumniEligibility, 
  canBecomeVolunteerInNextCohort,
  getMemberGroupAffiliations 
} from '../../utils/cohortRules';
import { isAppShaperUser, AVAILABLE_COMMUNITIES } from '../../constants';

export const CohortsManagement: React.FC = () => {
  const { 
    members, 
    yearConfig, 
    groups, 
    memberships, 
    addGroup, 
    updateGroup, 
    addMembership, 
    updateMembership, 
    removeMembership, 
    graduateCohort,
    availableCommunities: ctxCommunities 
  } = useData();
  const availableCommunities = ctxCommunities || AVAILABLE_COMMUNITIES;
  const { currentUser } = useAuth();
  const { showSuccess, showError, showConfirm } = useModal();

  // Selected view filter
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedCommunityFilter, setSelectedCommunityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rollover / Graduate Modal State
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
  const [closingCohortName, setClosingCohortName] = useState('מחזור ו׳');
  const [nextCohortName, setNextCohortName] = useState('מחזור ז׳');
  const [nextStartDate, setNextStartDate] = useState('2026-09-17');
  const [nextEndDate, setNextEndDate] = useState('2027-07-31');
  const [isRollingOver, setIsRollingOver] = useState(false);

  // Add / Edit Membership Modal State
  const [isAddMembershipOpen, setIsAddMembershipOpen] = useState(false);
  const [targetPersonId, setTargetPersonId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [targetCommunityId, setTargetCommunityId] = useState('herzliya');
  const [targetRole, setTargetRole] = useState<GroupMemberRole>('participant');
  const [isSavingMembership, setIsSavingMembership] = useState(false);

  // App-shaper or admin check
  const isAuthorized = 
    currentUser?.role === 'Admin' || 
    currentUser?.role === 'Staff' || 
    currentUser?.role === 'Support' ||
    isAppShaperUser(currentUser);

  // Active Cohort Group
  const activeCohort = useMemo(() => {
    return groups.find(g => g.isCurrentCohort) || 
      groups.find(g => g.type === 'cohort' && g.isActive) || 
      groups.find(g => g.id === 'cohort_active') || 
      null;
  }, [groups]);

  // Alumni Group
  const alumniGroup = useMemo(() => {
    return groups.find(g => g.type === 'alumni') || 
      groups.find(g => g.id === 'group_alumni') || 
      null;
  }, [groups]);

  // Past Cohorts
  const pastCohorts = useMemo(() => {
    return groups.filter(g => g.type === 'cohort' && !g.isActive && !g.isCurrentCohort);
  }, [groups]);

  // Enriched memberships list for table (includes explicit memberships and assigned communities)
  const enrichedMemberships = useMemo(() => {
    const list: Array<GroupMembership & {
      personName: string;
      personEmail: string;
      personAvatar?: string;
      groupName: string;
      groupType: string;
      isGroupActive: boolean;
      communityId?: string;
      communityName?: string;
    }> = [];

    const activeCohortId = activeCohort?.id || 'cohort_active';
    const alumniGroupId = alumniGroup?.id || 'group_alumni';

    memberships.forEach(m => {
      const person = members.find(p => p.id === m.personId);
      const group = groups.find(g => g.id === m.groupId);
      const commId = m.communityId || person?.communities?.[0] || 'herzliya';
      const commObj = availableCommunities.find(c => c.id === commId);
      const communityName = commObj?.name || (commId.endsWith('_adults') ? `${commId.replace('_adults', '')} - בוגרים` : commId);
      
      const personName = person 
        ? `${person.firstName || ''} ${person.lastName || ''}`.trim() 
        : (m.notes?.includes('בוראט') ? 'בוראט סאגדייב' : 'משתמש לא ידוע');

      list.push({
        ...m,
        communityId: commId,
        communityName,
        personName: personName || 'משתמש',
        personEmail: person?.email || '',
        personAvatar: person?.avatar,
        groupName: group?.name || 'קבוצה',
        groupType: group?.type || 'cohort',
        isGroupActive: group?.isActive || false
      });
    });

    // Synthesize for members who have community assignments but no explicit row in memberships
    members.forEach(member => {
      const isMultiGroup = 
        member.role === 'Staff' || 
        member.role === 'Admin' || 
        member.role === 'Instructor' || 
        member.role === 'Support' || 
        (member.communities || []).length >= 5 || 
        (member.communities || []).includes('all');

      if (isMultiGroup) {
        // Multi-group user: do not create duplicate rows for every group. Create a single entry tagged as 'מולטי־קבוצתי'.
        const alreadyExists = memberships.some(m => m.personId === member.id);
        if (!alreadyExists) {
          const memRole = member.role === 'Volunteer' ? 'volunteer' : member.role === 'Instructor' ? 'instructor' : member.role === 'Staff' ? 'coordinator' : 'coordinator';
          list.push({
            id: `synth_multi_${member.id}`,
            personId: member.id,
            groupId: 'all',
            communityId: 'all',
            communityName: 'מולטי־קבוצתי',
            role: memRole as any,
            status: 'active',
            joinedAt: member.joinedAt || new Date().toISOString(),
            notes: 'חבר ובעל הרשאת גישה לכלל הקבוצות והסניפים',
            personName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'משתמש',
            personEmail: member.email || '',
            personAvatar: member.avatar,
            groupName: 'כלל הקבוצות (מולטי־קבוצתי)',
            groupType: 'cohort' as any,
            isGroupActive: true
          });
        }
        return;
      }

      const memCommunities = (member.communities && member.communities.length > 0)
        ? member.communities
        : ['herzliya'];

      memCommunities.forEach(commId => {
        const isAdults = commId.endsWith('_adults');
        const targetGroupId = isAdults ? alumniGroupId : activeCohortId;
        const targetGroupObj = isAdults ? alumniGroup : activeCohort;
        const alreadyExists = memberships.some(m => m.personId === member.id && (m.groupId === targetGroupId || m.communityId === commId));

        if (!alreadyExists) {
          const commObj = availableCommunities.find(c => c.id === commId);
          const communityName = commObj?.name || commId;
          const memRole = member.role === 'Volunteer' ? 'volunteer' : member.role === 'Instructor' ? 'instructor' : member.role === 'Staff' ? 'coordinator' : 'participant';
          list.push({
            id: `synth_${targetGroupId}_${commId}_${member.id}`,
            personId: member.id,
            groupId: targetGroupId,
            communityId: commId,
            communityName,
            role: memRole as any,
            status: isAdults ? 'graduated' : 'active',
            joinedAt: member.joinedAt || new Date().toISOString(),
            notes: `שיוך קהילה - ${communityName}`,
            personName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'משתמש',
            personEmail: member.email || '',
            personAvatar: member.avatar,
            groupName: targetGroupObj?.name || (isAdults ? 'קבוצת בוגרים' : 'מחזור פעיל'),
            groupType: (isAdults ? 'alumni' : 'cohort') as any,
            isGroupActive: true
          });
        }
      });
    });

    return list;
  }, [memberships, members, groups, activeCohort, alumniGroup, availableCommunities]);

  // Stats for active cohort
  const activeCohortStats = useMemo(() => {
    if (!activeCohort) return { participants: 0, volunteers: 0, staff: 0, total: 0 };
    const cohortMems = enrichedMemberships.filter(m => m.groupId === activeCohort.id && m.status === 'active');
    return {
      participants: cohortMems.filter(m => m.role === 'participant').length,
      volunteers: cohortMems.filter(m => m.role === 'volunteer').length,
      staff: cohortMems.filter(m => m.role === 'instructor' || m.role === 'coordinator' || m.role === 'staff').length,
      total: cohortMems.length
    };
  }, [activeCohort, enrichedMemberships]);

  // Stats for alumni group
  const alumniStats = useMemo(() => {
    if (!alumniGroup) return { total: 0 };
    const aMems = enrichedMemberships.filter(m => m.groupId === alumniGroup.id && m.status !== 'paused');
    return {
      total: aMems.length
    };
  }, [alumniGroup, enrichedMemberships]);

  // Filtered memberships
  const filteredMemberships = useMemo(() => {
    return enrichedMemberships.filter(m => {
      const matchesGroup = selectedGroupId === 'all' || m.groupId === selectedGroupId || m.groupId === 'all';
      const matchesCommunity = selectedCommunityFilter === 'all' || m.communityId === selectedCommunityFilter || m.communityId === 'all';
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower ||
        m.personName.toLowerCase().includes(searchLower) ||
        m.personEmail.toLowerCase().includes(searchLower) ||
        m.groupName.toLowerCase().includes(searchLower) ||
        (m.communityName && m.communityName.toLowerCase().includes(searchLower)) ||
        (m.communityId && m.communityId.toLowerCase().includes(searchLower));
      return matchesGroup && matchesCommunity && matchesSearch;
    });
  }, [enrichedMemberships, selectedGroupId, selectedCommunityFilter, searchTerm]);

  // Target member object when creating new membership
  const targetMemberObj = useMemo(() => {
    return members.find(m => m.id === targetPersonId);
  }, [members, targetPersonId]);

  // Target group object
  const targetGroupObj = useMemo(() => {
    return groups.find(g => g.id === targetGroupId);
  }, [groups, targetGroupId]);

  // Eligibility check for selected person & group
  const alumniEligibility = useMemo(() => {
    if (!targetMemberObj || targetGroupObj?.type !== 'alumni') return null;
    return checkAlumniEligibility(targetMemberObj.id, targetMemberObj, memberships, groups);
  }, [targetMemberObj, targetGroupObj, memberships, groups]);

  // Can participant become volunteer?
  const canVolunteer = useMemo(() => {
    if (!targetMemberObj || targetGroupObj?.type !== 'cohort' || targetRole !== 'volunteer') return null;
    return canBecomeVolunteerInNextCohort(targetMemberObj.id, memberships, groups);
  }, [targetMemberObj, targetGroupObj, targetRole, memberships, groups]);

  // Handle Graduate / Rollover
  const handleGraduateCohort = async () => {
    if (!activeCohort) return;
    if (!nextCohortName.trim()) {
      showError('נא להזין שם למחזור החדש');
      return;
    }
    if (!nextStartDate || !nextEndDate) {
      showError('נא להזין תאריכי התחלה וסיום למחזור החדש');
      return;
    }

    setIsRollingOver(true);
    try {
      const closedName = closingCohortName.trim() || activeCohort.name;
      await graduateCohort({
        currentCohortId: activeCohort.id,
        closingCohortName: closedName,
        nextCohortName: nextCohortName.trim(),
        nextStartDate,
        nextEndDate
      });
      setIsRolloverModalOpen(false);
      showSuccess(`שנת הפעילות (${closedName}) נסגרה בהצלחה! המסיימים שובצו לקבוצת הבוגרים ונפתח ${nextCohortName.trim()}.`);
    } catch (err: any) {
      console.error(err);
      showError('שגיאה בתהליך גלגול המחזור: ' + (err.message || ''));
    } finally {
      setIsRollingOver(false);
    }
  };

  // Handle Add Membership
  const handleSaveMembership = async () => {
    if (!targetPersonId || !targetGroupId) {
      showError('נא לבחור חבר וקבוצה');
      return;
    }

    // Verify Alumni Eligibility
    if (targetGroupObj?.type === 'alumni') {
      const eligibility = checkAlumniEligibility(targetPersonId, targetMemberObj, memberships, groups);
      if (!eligibility.eligible) {
        showError(eligibility.reason);
        return;
      }
    }

    // Check if duplicate membership already exists
    const exists = memberships.some(m => m.personId === targetPersonId && m.groupId === targetGroupId);
    if (exists) {
      showError('החבר כבר משוייך לקבוצה זו');
      return;
    }

    setIsSavingMembership(true);
    try {
      await addMembership({
        personId: targetPersonId,
        groupId: targetGroupId,
        communityId: targetCommunityId,
        role: targetRole,
        status: 'active',
        joinedAt: new Date().toISOString()
      });
      setIsAddMembershipOpen(false);
      setTargetPersonId('');
      setTargetGroupId('');
      showSuccess('השיוך לקבוצה נוצר בהצלחה');
    } catch (err: any) {
      showError('שגיאה ביצירת השיוך');
    } finally {
      setIsSavingMembership(false);
    }
  };

  // Handle Remove Membership
  const handleRemoveMembership = (id: string, personName: string, groupName: string) => {
    showConfirm({
      title: 'הסרת שיוך לקבוצה',
      message: `האם להסיר את השיוך של ${personName} מתוך ${groupName}? פעולה זו לא תמחק את המשתמש עצמו.`,
      confirmText: 'כן, הסר שיוך',
      cancelText: 'ביטול',
      onConfirm: async () => {
        try {
          await removeMembership(id);
          showSuccess('השיוך הוסר בהצלחה');
        } catch (err) {
          showError('שגיאה בהסרת השיוך');
        }
      }
    });
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Banner & Overview */}
      <div className="luxury-card p-6 sm:p-8 bg-gradient-to-br from-white via-indigo-50/20 to-sky-50/30 border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <GraduationCap size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">ניהול מחזורים ובוגרים</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
                  ארכיטקטורת חבל זוג
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                הפרדה מבנית מלאה בין ישות אדם, שנת חבל זוג (מחזור פעיל), וקבוצת בוגרים עצמאית
              </p>
            </div>
          </div>

          {isAuthorized && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setTargetPersonId('');
                  setTargetGroupId(activeCohort?.id || '');
                  setIsAddMembershipOpen(true);
                }}
                className="px-4 py-2.5 bg-white text-indigo-600 border border-indigo-200/80 hover:bg-indigo-50/50 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <UserPlus size={16} />
                שיוך חבר לקבוצה
              </button>

              <button
                onClick={() => {
                  const currentActiveName = activeCohort?.name || yearConfig?.name || 'מחזור ז׳';
                  setClosingCohortName(currentActiveName);
                  const nextSuggested = currentActiveName.includes('ז') ? 'מחזור ח׳' : (currentActiveName.includes('ו') ? 'מחזור ז׳' : 'מחזור ח׳');
                  setNextCohortName(nextSuggested);
                  setNextStartDate('2027-09-01');
                  setNextEndDate('2028-07-31');
                  setIsRolloverModalOpen(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-98 cursor-pointer"
              >
                <RefreshCw size={16} />
                סיום מחזור וסגירת שנת פעילות
              </button>
            </div>
          )}
        </div>

        {/* 2 Main Cards: Active Cohort & Alumni Group */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
          {/* Active Cohort Card */}
          <div className="p-6 rounded-2xl bg-white/90 border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-sky-500" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black">
                  🌊
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-800">
                      {activeCohort?.name || yearConfig?.name || 'מחזור ז׳'}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      מחזור פעיל כעת
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400">שנת חבל זוג הנוכחית</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 tabular-nums">
                {activeCohort?.startDate || yearConfig?.startDate || '---'} עד {activeCohort?.endDate || yearConfig?.endDate || '---'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400">משתתפים</p>
                <p className="text-xl font-black text-sky-600 tabular-nums">{activeCohortStats.participants}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400">מתנדבים</p>
                <p className="text-xl font-black text-indigo-600 tabular-nums">{activeCohortStats.volunteers}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400">מדריכים וסגל</p>
                <p className="text-xl font-black text-emerald-600 tabular-nums">{activeCohortStats.staff}</p>
              </div>
            </div>
          </div>

          {/* Alumni Group Card */}
          <div className="p-6 rounded-2xl bg-white/90 border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  🎓
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-800">
                      {alumniGroup?.name || 'קבוצת בוגרים'}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                      קהילה עצמאית
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400">משתתפים ומתנדבים שהשלימו מחזור</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">
                פעילה ברציפות
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400">בוגרים רשומים</p>
                <p className="text-xl font-black text-indigo-600 tabular-nums">{alumniStats.total}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400">מחזורים שהסתיימו</p>
                <p className="text-xl font-black text-slate-700 tabular-nums">{pastCohorts.length || 1}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Explanatory Bar */}
      <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 text-indigo-950 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">חוקי הארגון והטרמינולוגיה המובנים במערכת:</p>
            <ul className="text-slate-600 list-disc list-inside space-y-0.5 text-[11px]">
              <li><strong>קבוצת בוגרים:</strong> פתוחה אך ורק למשתתפים ומתנדבים שסיימו בהצלחה מחזור פעילות קודם.</li>
              <li><strong>התנדבות במחזור הבא:</strong> משתתף שסיים מחזור רשאי להפוך למתנדב במחזור החדש.</li>
              <li><strong>מדריכים, רכזים וצוות עמותה:</strong> משוייכים לכל קבוצה ללא הגבלה ובמקביל.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter and Memberships List */}
      <div className="luxury-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Group Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedGroupId('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedGroupId === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              כל השיוכים ({enrichedMemberships.length})
            </button>
            {activeCohort && (
              <button
                onClick={() => setSelectedGroupId(activeCohort.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedGroupId === activeCohort.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-100'
                }`}
              >
                <span>🌊</span>
                <span>{activeCohort.name} (פעיל)</span>
              </button>
            )}
            {alumniGroup && (
              <button
                onClick={() => setSelectedGroupId(alumniGroup.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedGroupId === alumniGroup.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                }`}
              >
                <span>🎓</span>
                <span>קבוצת בוגרים</span>
              </button>
            )}
            {pastCohorts.map(pc => (
              <button
                key={pc.id}
                onClick={() => setSelectedGroupId(pc.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedGroupId === pc.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>📜</span>
                <span>{pc.name} (הסתיים)</span>
              </button>
            ))}
            {/* Community / Branch Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedCommunityFilter}
                onChange={(e) => setSelectedCommunityFilter(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-white border border-slate-200 text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 shadow-xs hover:bg-slate-50 transition-all"
              >
                <option value="all">כל הסניפים והקבוצות ({enrichedMemberships.length})</option>
                {availableCommunities.map(c => {
                  const count = enrichedMemberships.filter(m => m.communityId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.isAdults ? '🎓 ' : '🌊 '}{c.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="חיפוש חבר, קבוצה או סניף..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white text-slate-700 transition-all"
            />
          </div>
        </div>

        {/* Table of Memberships */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">חבר / אדם</th>
                <th className="py-3 px-4">סניף / קהילה</th>
                <th className="py-3 px-4">קבוצה / מחזור</th>
                <th className="py-3 px-4">תפקיד בקבוצה</th>
                <th className="py-3 px-4">סטטוס שיוך</th>
                <th className="py-3 px-4">תאריך הצטרפות</th>
                {isAuthorized && <th className="py-3 px-4 text-center">פעולות</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMemberships.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                    לא נמצאו שיוכים לקבוצה זו
                  </td>
                </tr>
              ) : (
                filteredMemberships.map(mem => (
                  <tr key={mem.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-black text-slate-600 text-xs flex-shrink-0">
                          {mem.personAvatar ? (
                            <img src={mem.personAvatar} alt={mem.personName} className="w-full h-full object-cover" />
                          ) : (
                            mem.personName.charAt(0) || '?'
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{mem.personName}</p>
                          <p className="text-[10px] text-slate-400">{mem.personEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                      {mem.communityId === 'all' || mem.communityName === 'מולטי־קבוצתי' ? (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-black inline-flex items-center gap-1.5 border bg-gradient-to-r from-indigo-50 to-sky-50 text-indigo-700 border-indigo-200/90 shadow-2xs">
                          <span>🌐</span>
                          <span>מולטי־קבוצתי</span>
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black inline-flex items-center gap-1.5 border ${
                          mem.communityId?.endsWith('_adults')
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}>
                          <span>{mem.communityId?.endsWith('_adults') ? '🎓' : '🌊'}</span>
                          <span>{mem.communityName || 'הרצליה'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        {mem.groupType === 'alumni' ? '🎓' : '🌊'}
                        <span>{mem.groupName}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${
                        mem.role === 'coordinator' ? 'bg-amber-100 text-amber-800' :
                        mem.role === 'staff' ? 'bg-purple-100 text-purple-800' :
                        mem.role === 'instructor' ? 'bg-emerald-100 text-emerald-800' :
                        mem.role === 'volunteer' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {GROUP_ROLE_LABELS[mem.role] || mem.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-bold ${
                        mem.status === 'active' ? 'text-emerald-600' :
                        mem.status === 'graduated' ? 'text-indigo-600' :
                        mem.status === 'completed' ? 'text-blue-600' :
                        'text-slate-400'
                      }`}>
                        {MEMBERSHIP_STATUS_LABELS[mem.status] || mem.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                      {mem.joinedAt ? new Date(mem.joinedAt).toLocaleDateString('he-IL') : '---'}
                    </td>
                    {isAuthorized && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleRemoveMembership(mem.id, mem.personName, mem.groupName)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all inline-flex items-center justify-center cursor-pointer"
                          title="הסר שיוך"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rollover / Graduate Cohort Modal */}
      {isRolloverModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 p-6 text-white text-center">
              <RefreshCw size={36} className="mx-auto mb-2 text-white/90 animate-spin-slow" />
              <h3 className="text-xl font-black">סיום מחזור וסגירת שנת פעילות</h3>
              <p className="text-xs text-indigo-100 font-medium">
                סגירת שנת חבל זוג, העברת מסיימים לבוגרים, ופתיחת מחזור חדש
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1.5 text-right">
                <p className="font-black text-amber-950 flex items-center gap-1.5">
                  <span>📋</span>
                  <span>תהליך מסודר של סגירת שנת פעילות וגלגול מחזור:</span>
                </p>
                <p>1. שנת הפעילות והמחזור המסתיים יישמרו בארכיון הפעילויות כולל כל הנתונים, הנוכחות וה-KPIs.</p>
                <p>2. כל המשתתפים והמתנדבים שסיימו את המחזור יועברו אוטומטית כבוגרים ל<strong>קבוצת הבוגרים</strong>.</p>
                <p>3. ייפתח דף חלק לשנת חבל הזוג החדשה, אליה יגולגלו אוטומטית רכזים, מדריכים וצוות עמותה.</p>
                <p>4. משתתפים שסיימו רשאים להפוך למתנדבים במחזור החדש.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider pr-1">
                    שם המחזור המסתיים / נסגר
                  </label>
                  <input
                    type="text"
                    value={closingCohortName}
                    onChange={e => setClosingCohortName(e.target.value)}
                    placeholder="לדוגמה: מחזור ו׳"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white text-slate-800 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 font-medium pr-1">המחזור הנוכחי שמסיים כעת את שנת חבל הזוג (למשל: "מחזור ו׳")</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider pr-1">
                    שם שנת חבל הזוג / המחזור החדש
                  </label>
                  <input
                    type="text"
                    value={nextCohortName}
                    onChange={e => setNextCohortName(e.target.value)}
                    placeholder="לדוגמה: מחזור ז׳"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white text-slate-800 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 font-medium pr-1">המחזור החדש שנפתח לתקופת הפעילות הבאה (למשל: "מחזור ז׳")</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider pr-1">
                      תאריך התחלה חדש
                    </label>
                    <input
                      type="date"
                      value={nextStartDate}
                      onChange={e => setNextStartDate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white text-slate-700 text-sm cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider pr-1">
                      תאריך סיום חדש
                    </label>
                    <input
                      type="date"
                      value={nextEndDate}
                      onChange={e => setNextEndDate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white text-slate-700 text-sm cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleGraduateCohort}
                  disabled={isRollingOver}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 size={18} />
                  <span>אישור ופתיחת שנת חבל זוג חדשה</span>
                </button>
                <button
                  onClick={() => setIsRolloverModalOpen(false)}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
                >
                  ביטול
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add / Assign Membership Modal */}
      {isAddMembershipOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-6 text-white text-center">
              <UserPlus size={36} className="mx-auto mb-2 text-white/90" />
              <h3 className="text-xl font-black">שיוך חבר קהילה לקבוצה</h3>
              <p className="text-xs text-sky-100 font-medium">קביעת כובע ותפקיד במחזור או בקבוצת הבוגרים</p>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {/* Select Member */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider pr-1">בחר חבר קהילה</label>
                <select
                  value={targetPersonId}
                  onChange={e => setTargetPersonId(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500/20 text-slate-800 text-xs"
                >
                  <option value="">-- בחר חבר --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Community / Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider pr-1">סניף / קהילה מקומית</label>
                <select
                  value={targetCommunityId}
                  onChange={e => setTargetCommunityId(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500/20 text-slate-800 text-xs"
                >
                  {availableCommunities.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.isAdults ? '🎓 ' : '🌊 '}{c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider pr-1">בחר קבוצה</label>
                <select
                  value={targetGroupId}
                  onChange={e => setTargetGroupId(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500/20 text-slate-800 text-xs"
                >
                  <option value="">-- בחר קבוצה --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.type === 'cohort' ? 'מחזור' : 'בוגרים'}) {g.isActive ? '• פעיל' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider pr-1">תפקיד בקבוצה</label>
                <select
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value as GroupMemberRole)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500/20 text-slate-800 text-xs"
                >
                  <option value="participant">משתתף</option>
                  <option value="volunteer">מתנדב</option>
                  <option value="instructor">מדריך</option>
                  <option value="coordinator">רכז</option>
                  <option value="staff">צוות עמותה</option>
                </select>
              </div>

              {/* Eligibility Feedback */}
              {alumniEligibility && (
                <div className={`p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${
                  alumniEligibility.eligible 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <p className="font-bold mb-0.5">
                    {alumniEligibility.eligible ? '✓ בדיקת זכאות עברה בהצלחה' : '✕ לא ניתן לצרף לקבוצת בוגרים'}
                  </p>
                  <p className="text-[11px]">{alumniEligibility.reason}</p>
                </div>
              )}

              {canVolunteer && (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-800 text-[11px] font-medium">
                  ✓ משתתף שסיים מחזור קודם רשאי להפוך למתנדב במחזור הנוכחי.
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleSaveMembership}
                  disabled={Boolean(isSavingMembership || (alumniEligibility && !alumniEligibility.eligible))}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>שמור שיוך</span>
                </button>
                <button
                  onClick={() => setIsAddMembershipOpen(false)}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
                >
                  ביטול
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default CohortsManagement;
