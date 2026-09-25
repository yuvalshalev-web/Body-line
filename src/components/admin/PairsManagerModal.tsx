import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Link2, Unlink, User, UserPlus, Users, ChevronDown, 
  Check, AlertCircle, CheckCircle2, ShieldCheck, UserCheck, Layers, Info
} from 'lucide-react';
import { Member } from '../../types';
import { useData } from '../../contexts/DataContext';

interface PairsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members?: Member[];
  onUpdateMember?: (member: Member) => Promise<void>;
  onLinkPair?: (memberAId: string, memberBId: string, group?: string) => Promise<void>;
  onUnlinkPair?: (memberAId: string, memberBId?: string) => Promise<void>;
}

const translateRole = (role?: string) => {
  switch (role) {
    case 'Admin': return 'רכז';
    case 'Staff': return 'צוות עמותה';
    case 'Support': return 'אפ-שייפר';
    case 'Instructor': return 'מדריך';
    case 'Volunteer': return 'מתנדב';
    case 'Member': return 'משתתף';
    default: return role || '';
  }
};

export const getMemberGroupType = (g?: string): 'GROUP_A' | 'GROUP_B' | 'NONE' => {
  if (!g) return 'NONE';
  const str = String(g).trim();
  if (str.includes('א') || str.includes('A') || str.toLowerCase().includes('group a')) {
    return 'GROUP_A';
  }
  if (str.includes('קבוצה ב') || str.includes('ב\'') || str.includes('ב') || str.includes('B') || str.toLowerCase().includes('group b')) {
    return 'GROUP_B';
  }
  return 'NONE';
};

const CustomMemberSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: Member[]; 
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  
  return (
    <div className="relative">
      <div 
        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-700 font-medium focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
              {selected.avatar ? <img src={selected.avatar} className="w-full h-full object-cover" alt="" /> : <User size={16} className="m-auto mt-1.5 text-slate-400" />}
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold leading-tight">{selected.firstName} {selected.lastName}</span>
              <span className="text-[10px] text-slate-500">{translateRole(selected.role)}</span>
            </div>
          </div>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
            >
              {options.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">אין אפשרויות זמינות</div>
              ) : (
                options.map(option => (
                  <div 
                    key={option.id}
                    className={`flex items-center justify-between p-3 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${value === option.id ? 'bg-indigo-50/50' : ''}`}
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                        {option.avatar ? <img src={option.avatar} className="w-full h-full object-cover" alt="" /> : <User size={16} className="m-auto mt-1.5 text-slate-400" />}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-sm font-bold text-slate-700">{option.firstName} {option.lastName}</span>
                        <span className="text-[10px] text-slate-500">{translateRole(option.role)}</span>
                      </div>
                    </div>
                    {value === option.id && <Check size={16} className="text-indigo-600" />}
                  </div>
                ))
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const PairsManagerModal: React.FC<PairsManagerModalProps> = ({
  isOpen,
  onClose,
  members: propMembers,
  onUpdateMember,
  onLinkPair,
  onUnlinkPair
}) => {
  const dataContext = useData();
  const members = propMembers || dataContext.members;
  const contextLinkPair = onLinkPair || dataContext.linkPair;
  const contextUnlinkPair = onUnlinkPair || dataContext.unlinkPair;
  const contextUpdateMember = onUpdateMember || dataContext.updateMember;

  const [activeTab, setActiveTab] = useState<'PAIRS' | 'COORDINATORS' | 'STAFF_INFO'>('PAIRS');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'GROUP_A' | 'GROUP_B' | 'NONE'>('ALL');
  
  // Pair creation form state
  const [selectedMemberA, setSelectedMemberIdA] = useState<string>('');
  const [selectedMemberB, setSelectedMemberIdB] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<'קבוצה א\'' | 'קבוצה ב\''>('קבוצה א\'');
  const [isLinking, setIsLinking] = useState(false);
  
  // Pair unlinking state
  const [pairToUnlink, setPairToUnlink] = useState<{ a: Member; b: Member } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  
  // Coordinator group updating state
  const [updatingCoordinatorId, setUpdatingCoordinatorId] = useState<string | null>(null);
  const [updatingPairKey, setUpdatingPairKey] = useState<string | null>(null);
  const [coordinatorGroupOverrides, setCoordinatorGroupOverrides] = useState<Record<string, string>>({});
  
  // Group change confirmation popup state
  const [pendingGroupChange, setPendingGroupChange] = useState<{
    type: 'COORDINATOR' | 'PAIR';
    targetName: string;
    newGroup: 'קבוצה א\'' | 'קבוצה ב\'';
    currentGroup?: string;
    coordinator?: Member;
    pair?: { a: Member; b: Member; group?: string };
  } | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string, duration = 3500) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), duration);
  };

  // Active members only
  const activeMembers = useMemo(() => members.filter(m => m.isActive !== false), [members]);

  // Derived pairs list
  const pairs = useMemo(() => {
    const pairsMap = new Map<string, { a: Member, b: Member, group?: string }>();
    const seenIds = new Set<string>();

    activeMembers.forEach(m => {
      if (m.partnerId && !seenIds.has(m.id)) {
        const partner = activeMembers.find(p => p.id === m.partnerId);
        if (partner) {
          seenIds.add(m.id);
          seenIds.add(partner.id);
          const effectiveGroup = m.assignedGroup || m.group || partner.assignedGroup || partner.group || '';
          pairsMap.set(`${m.id}-${partner.id}`, { a: m, b: partner, group: effectiveGroup });
        }
      }
    });
    return Array.from(pairsMap.values());
  }, [activeMembers]);

  // Coordinators list (role === 'Admin')
  const coordinators = useMemo(() => {
    return activeMembers.filter(m => m.role === 'Admin');
  }, [activeMembers]);

  // Instructors and Staff (General / Non-grouped)
  const generalStaff = useMemo(() => {
    return activeMembers.filter(m => m.role === 'Instructor' || m.role === 'Staff');
  }, [activeMembers]);

  // Available for pairing (unpaired active members)
  const unpairedMembers = useMemo(() => activeMembers.filter(m => !m.partnerId), [activeMembers]);
  const unpairedVolunteers = useMemo(() => unpairedMembers.filter(m => m.role === 'Volunteer'), [unpairedMembers]);
  const unpairedParticipants = useMemo(() => unpairedMembers.filter(m => m.role === 'Member'), [unpairedMembers]);

  // Filtered pairs list
  const filteredPairs = useMemo(() => {
    return pairs.filter(pair => {
      const nameA = `${pair.a.firstName} ${pair.a.lastName}`.toLowerCase();
      const nameB = `${pair.b.firstName} ${pair.b.lastName}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || nameA.includes(searchLower) || nameB.includes(searchLower);

      if (!matchesSearch) return false;

      const gType = getMemberGroupType(pair.group);
      if (groupFilter === 'GROUP_A') return gType === 'GROUP_A';
      if (groupFilter === 'GROUP_B') return gType === 'GROUP_B';
      if (groupFilter === 'NONE') return gType === 'NONE';
      return true;
    });
  }, [pairs, searchTerm, groupFilter]);

  // Handle Link Pair with Group Assignment
  const handleLink = async () => {
    if (!selectedMemberA || !selectedMemberB || selectedMemberA === selectedMemberB) return;
    setIsLinking(true);
    try {
      const memberA = members.find(m => m.id === selectedMemberA);
      const memberB = members.find(m => m.id === selectedMemberB);
      
      if (memberA && memberB) {
        const isValid = 
          (memberA.role === 'Volunteer' && memberB.role === 'Member') ||
          (memberA.role === 'Member' && memberB.role === 'Volunteer');

        if (!isValid) {
          showFeedback('error', 'חבל זוג מתאפשר אך ורק בין מתנדב למשתתף. רכזים, צוות עמותה ומדריכים אינם יכולים להיות בני זוג.');
          setIsLinking(false);
          return;
        }

        if (contextLinkPair) {
          await contextLinkPair(memberA.id, memberB.id, selectedGroup);
        } else if (contextUpdateMember) {
          await contextUpdateMember({ ...memberA, partnerId: memberB.id, assignedGroup: selectedGroup, group: selectedGroup });
          await contextUpdateMember({ ...memberB, partnerId: memberA.id, assignedGroup: selectedGroup, group: selectedGroup });
        }

        setSelectedMemberIdA('');
        setSelectedMemberIdB('');
        showFeedback('success', `נוצר חבל זוג בין ${memberA.firstName} ל${memberB.firstName} ושויך ל-${selectedGroup} בהצלחה!`);
      }
    } catch (e: any) {
      console.error(e);
      showFeedback('error', e?.message || 'שגיאה ביצירת צמד, אנא נסה שוב.');
    } finally {
      setIsLinking(false);
    }
  };

  // Handle Changing an Existing Pair's Group
  const handleChangePairGroup = async (pair: { a: Member; b: Member; group?: string }, newGroup: 'קבוצה א\'' | 'קבוצה ב\'' | '') => {
    const pairKey = `${pair.a.id}-${pair.b.id}`;
    setUpdatingPairKey(pairKey);
    try {
      if (contextUpdateMember) {
        await contextUpdateMember({ ...pair.a, assignedGroup: newGroup, group: newGroup });
        await contextUpdateMember({ ...pair.b, assignedGroup: newGroup, group: newGroup });
      }
      showFeedback('success', `הזוג ${pair.a.firstName} ו${pair.b.firstName} עודכן ל-${newGroup || 'ללא קבוצה'}`);
    } catch (err: any) {
      console.error(err);
      showFeedback('error', 'שגיאה בעדכון קבוצת הזוג');
    } finally {
      setUpdatingPairKey(null);
    }
  };

  // Request Pair Group Change with Confirmation Modal
  const requestPairGroupChange = (pair: { a: Member; b: Member; group?: string }, targetGroup: 'קבוצה א\'' | 'קבוצה ב\'') => {
    const currentGType = getMemberGroupType(pair.group);
    const targetGType = getMemberGroupType(targetGroup);
    if (currentGType === targetGType) return;

    setPendingGroupChange({
      type: 'PAIR',
      targetName: `הזוג ${pair.a.firstName} ו${pair.b.firstName}`,
      newGroup: targetGroup,
      currentGroup: currentGType === 'GROUP_A' ? 'קבוצה א\'' : currentGType === 'GROUP_B' ? 'קבוצה ב\'' : 'ללא שיוך',
      pair
    });
  };

  // Handle Coordinator Group Change
  const handleCoordinatorGroupChange = async (coordinator: Member, newGroup: 'קבוצה א\'' | 'קבוצה ב\'' | '') => {
    // Optimistic UI update immediately
    setCoordinatorGroupOverrides(prev => ({ ...prev, [coordinator.id]: newGroup }));
    setUpdatingCoordinatorId(coordinator.id);
    try {
      if (contextUpdateMember) {
        await contextUpdateMember({
          ...coordinator,
          assignedGroup: newGroup,
          group: newGroup
        });
      }
      showFeedback('success', `הרכז ${coordinator.firstName} ${coordinator.lastName} שוייך ל-${newGroup || 'ללא קבוצה'} בהצלחה!`);
    } catch (err: any) {
      console.error(err);
      // Revert optimistic update on error
      setCoordinatorGroupOverrides(prev => {
        const next = { ...prev };
        delete next[coordinator.id];
        return next;
      });
      showFeedback('error', 'שגיאה בעדכון קבוצת הרכז');
    } finally {
      setUpdatingCoordinatorId(null);
    }
  };

  // Request Coordinator Group Change with Confirmation Modal
  const requestCoordinatorGroupChange = (coordinator: Member, targetGroup: 'קבוצה א\'' | 'קבוצה ב\'') => {
    const rawGroup = coordinatorGroupOverrides[coordinator.id] !== undefined
      ? coordinatorGroupOverrides[coordinator.id]
      : (coordinator.assignedGroup || coordinator.group || '');
    const currentGType = getMemberGroupType(rawGroup);
    const targetGType = getMemberGroupType(targetGroup);
    if (currentGType === targetGType) return; // already in this group
    
    setPendingGroupChange({
      type: 'COORDINATOR',
      targetName: `הרכז/ת ${coordinator.firstName} ${coordinator.lastName}`,
      newGroup: targetGroup,
      currentGroup: currentGType === 'GROUP_A' ? 'קבוצה א\'' : currentGType === 'GROUP_B' ? 'קבוצה ב\'' : 'ללא שיוך',
      coordinator
    });
  };

  // Handle Confirmation of Group Change
  const handleConfirmGroupChange = async () => {
    if (!pendingGroupChange) return;
    const change = pendingGroupChange;
    setPendingGroupChange(null);

    if (change.type === 'COORDINATOR' && change.coordinator) {
      await handleCoordinatorGroupChange(change.coordinator, change.newGroup);
    } else if (change.type === 'PAIR' && change.pair) {
      await handleChangePairGroup(change.pair, change.newGroup);
    }
  };

  // Handle Unlink Pair
  const confirmUnlink = async () => {
    if (!pairToUnlink) return;
    setIsUnlinking(true);
    try {
      if (contextUnlinkPair) {
        await contextUnlinkPair(pairToUnlink.a.id, pairToUnlink.b.id);
      } else if (contextUpdateMember) {
        const updatedA = { ...pairToUnlink.a, partnerId: '', assignedGroup: '', group: '' };
        const updatedB = { ...pairToUnlink.b, partnerId: '', assignedGroup: '', group: '' };
        await contextUpdateMember(updatedA);
        await contextUpdateMember(updatedB);
      }
      
      const nameA = pairToUnlink.a.firstName;
      const nameB = pairToUnlink.b.firstName;
      setPairToUnlink(null);
      showFeedback('success', `חבל הזוג בין ${nameA} ל${nameB} נותק והשיוך לקבוצה הוסר בהצלחה!`);
    } catch (e) {
      console.error(e);
      showFeedback('error', 'שגיאה בניתוק הזוג, אנא נסה שוב.');
    } finally {
      setIsUnlinking(false);
    }
  };

  if (!isOpen) return null;

  const pairsCountA = pairs.filter(p => getMemberGroupType(p.group) === 'GROUP_A').length;
  const pairsCountB = pairs.filter(p => getMemberGroupType(p.group) === 'GROUP_B').length;
  const coordsCountA = coordinators.filter(c => getMemberGroupType(coordinatorGroupOverrides[c.id] !== undefined ? coordinatorGroupOverrides[c.id] : (c.assignedGroup || c.group)) === 'GROUP_A').length;
  const coordsCountB = coordinators.filter(c => getMemberGroupType(coordinatorGroupOverrides[c.id] !== undefined ? coordinatorGroupOverrides[c.id] : (c.assignedGroup || c.group)) === 'GROUP_B').length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col relative"
          dir="rtl"
        >
          {/* Top Feedback Banner */}
          <AnimatePresence>
            {feedbackMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute top-4 left-1/2 -translate-x-1/2 z-60 px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 text-sm font-bold border ${
                  feedbackMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
                <span>{feedbackMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Header */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-[var(--surfer-aqua-mist)]/20 via-indigo-50/20 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[var(--surfer-vibrant-cyan)] shadow-sm">
                  <Link2 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">ניהול זוגות וקבוצות - חבל זוג</h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-500">חיבור חבל זוג (מתנדב ומשתתף) ושיוך לקבוצה א' או קבוצה ב'</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="סגור"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setActiveTab('PAIRS')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                  activeTab === 'PAIRS'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200'
                }`}
              >
                <Users size={16} />
                <span>זוגות חבל ({pairs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('COORDINATORS')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                  activeTab === 'COORDINATORS'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200'
                }`}
              >
                <ShieldCheck size={16} />
                <span>שיוך רכזים ({coordinators.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('STAFF_INFO')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                  activeTab === 'STAFF_INFO'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200'
                }`}
              >
                <Info size={16} />
                <span>מדריכים וצוות עמותה</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
            {activeTab === 'PAIRS' && (
              <>
                {/* Create Pair Section with Group Assignment */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-indigo-500" />
                    יצירת זוג חדש ושיוך לקבוצה
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Volunteer */}
                    <div className="md:col-span-4 w-full">
                      <label className="block text-xs font-bold text-slate-500 mb-2">מתנדב</label>
                      <CustomMemberSelect
                        value={selectedMemberA}
                        onChange={(val) => setSelectedMemberIdA(val)}
                        options={unpairedVolunteers}
                        placeholder="בחר מתנדב/ת..."
                      />
                    </div>
                    
                    <div className="hidden md:flex md:col-span-1 items-center justify-center pb-3 text-slate-300">
                      <Link2 size={24} />
                    </div>
                    
                    {/* Participant */}
                    <div className="md:col-span-4 w-full">
                      <label className="block text-xs font-bold text-slate-500 mb-2">משתתף</label>
                      <CustomMemberSelect
                        value={selectedMemberB}
                        onChange={(val) => setSelectedMemberIdB(val)}
                        options={unpairedParticipants}
                        placeholder="בחר משתתפ/ת..."
                      />
                    </div>

                    {/* Group Selector */}
                    <div className="md:col-span-3 w-full">
                      <label className="block text-xs font-bold text-slate-500 mb-2">שיוך לקבוצה</label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setSelectedGroup('קבוצה א\'')}
                          className={`py-2 px-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1 ${
                            selectedGroup === 'קבוצה א\''
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>קבוצה א׳</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGroup('קבוצה ב\'')}
                          className={`py-2 px-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1 ${
                            selectedGroup === 'קבוצה ב\''
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>קבוצה ב׳</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="md:col-span-12 flex justify-end mt-2">
                      <button
                        onClick={handleLink}
                        disabled={!selectedMemberA || !selectedMemberB || selectedMemberA === selectedMemberB || isLinking}
                        className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
                      >
                        {isLinking ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            מחבר ומשייך...
                          </>
                        ) : (
                          <>
                            <Link2 size={18} />
                            <span>חבר זוג ושייך ל{selectedGroup}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Pairs Section with Group Badges & Filter */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                      <Users size={20} className="text-[var(--surfer-electric-pink)]" />
                      זוגות קיימים ({pairs.length})
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Group Filter Tabs */}
                      <div className="flex bg-white border border-slate-200 p-1 rounded-xl text-xs font-bold shadow-xs">
                        <button
                          type="button"
                          onClick={() => setGroupFilter('ALL')}
                          className={`px-3 py-1.5 rounded-lg transition-colors ${groupFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          הכל ({pairs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupFilter('GROUP_A')}
                          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${groupFilter === 'GROUP_A' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          קבוצה א׳ ({pairsCountA})
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupFilter('GROUP_B')}
                          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${groupFilter === 'GROUP_B' ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-50'}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          קבוצה ב׳ ({pairsCountB})
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="חיפוש בזוגות..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-4 pr-10 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[var(--surfer-vibrant-cyan)] w-full sm:w-48 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPairs.map((pair, idx) => {
                      const isPairCompliant = 
                        (pair.a.role === 'Volunteer' && pair.b.role === 'Member') ||
                        (pair.a.role === 'Member' && pair.b.role === 'Volunteer');
                      const currentGroup = pair.group || '';
                      const pairKey = `${pair.a.id}-${pair.b.id}`;
                      const isUpdatingGroup = updatingPairKey === pairKey;

                      return (
                        <div key={idx} className={`bg-white rounded-2xl border ${isPairCompliant ? 'border-slate-200' : 'border-amber-300 bg-amber-50/20'} p-4 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}>
                          {/* Group Header & Actions */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              {getMemberGroupType(currentGroup) === 'GROUP_A' ? (
                                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs font-black rounded-lg flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                                  קבוצה א׳
                                </span>
                              ) : getMemberGroupType(currentGroup) === 'GROUP_B' ? (
                                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black rounded-lg flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                                  קבוצה ב׳
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-lg">
                                  ללא קבוצה
                                </span>
                              )}

                              {/* Quick Group Switcher Buttons */}
                              <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                                <button
                                  type="button"
                                  disabled={isUpdatingGroup}
                                  onClick={() => requestPairGroupChange(pair, 'קבוצה א\'')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                                    getMemberGroupType(currentGroup) === 'GROUP_A'
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
                                  }`}
                                  title="העבר זוג לקבוצה א׳"
                                >
                                  א׳
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdatingGroup}
                                  onClick={() => requestPairGroupChange(pair, 'קבוצה ב\'')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                                    getMemberGroupType(currentGroup) === 'GROUP_B'
                                      ? 'bg-purple-600 text-white'
                                      : 'text-slate-500 hover:text-purple-700 hover:bg-purple-50'
                                  }`}
                                  title="העבר זוג לקבוצה ב׳"
                                >
                                  ב׳
                                </button>
                              </div>
                            </div>

                            {/* Unlink Action Button */}
                            <button 
                              onClick={() => setPairToUnlink(pair)}
                              className="w-8 h-8 flex items-center justify-center text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-90 border border-rose-200 rounded-lg transition-all shadow-xs"
                              title={`הפרד את ${pair.a.firstName} ו${pair.b.firstName}`}
                              aria-label={`הפרד את ${pair.a.firstName} ו${pair.b.firstName}`}
                            >
                              <Unlink size={16} />
                            </button>
                          </div>

                          {!isPairCompliant && (
                            <div className="bg-amber-100 text-amber-900 text-[11px] font-black px-3 py-1 rounded-lg flex items-center justify-between border border-amber-200">
                              <span>⚠️ שיבוץ ישן לא תואם (רכז/צוות אינם יכולים להיות בני זוג)</span>
                              <span className="text-[10px] text-amber-800">מומלץ לנתק</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1">
                              {/* Person A */}
                              <div className="flex flex-col items-center gap-1 w-24 shrink-0">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border-2 border-indigo-100 shadow-xs">
                                  {pair.a.avatar ? <img src={pair.a.avatar} className="w-full h-full object-cover" alt="" /> : <User className="w-full h-full p-2 text-slate-400" />}
                                </div>
                                <span className="text-xs font-bold text-slate-700 text-center leading-tight truncate max-w-full">
                                  {pair.a.firstName} {pair.a.lastName}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pair.a.role === 'Volunteer' ? 'text-indigo-500 bg-indigo-50' : pair.a.role === 'Member' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-700 bg-amber-100'}`}>
                                  {translateRole(pair.a.role)}
                                </span>
                              </div>
                              
                              {/* Link Icon with Rope Emoji */}
                              <div className="flex flex-col items-center justify-center text-[var(--surfer-vibrant-cyan)] shrink-0 px-1">
                                <span className="text-xl">🪢</span>
                                <span className="text-[9px] font-black tracking-wider uppercase mt-0.5 text-slate-400">חבל זוג</span>
                              </div>
                              
                              {/* Person B */}
                              <div className="flex flex-col items-center gap-1 w-24 shrink-0">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border-2 border-indigo-100 shadow-xs">
                                  {pair.b.avatar ? <img src={pair.b.avatar} className="w-full h-full object-cover" alt="" /> : <User className="w-full h-full p-2 text-slate-400" />}
                                </div>
                                <span className="text-xs font-bold text-slate-700 text-center leading-tight truncate max-w-full">
                                  {pair.b.firstName} {pair.b.lastName}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pair.b.role === 'Member' ? 'text-emerald-600 bg-emerald-50' : pair.b.role === 'Volunteer' ? 'text-indigo-500 bg-indigo-50' : 'text-amber-700 bg-amber-100'}`}>
                                  {translateRole(pair.b.role)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                    {filteredPairs.length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
                        לא נמצאו זוגות התואמים לחיפוש או לסינון הנוכחי.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'COORDINATORS' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border border-blue-100">
                  <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-blue-600" />
                    שיוך רכזים לקבוצות פעילות (בחירה יחידה)
                  </h3>
                  <p className="text-xs font-bold text-slate-600">
                    רכז (Admin) מוביל קבוצה ומשוייך <strong>בלעדית לקבוצה אחת בלבד</strong> – קבוצה א׳ או קבוצה ב׳. לא ניתן לשייך רכז ליותר מקבוצה אחת.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coordinators.map((coordinator) => {
                    const rawGroup = coordinatorGroupOverrides[coordinator.id] !== undefined
                      ? coordinatorGroupOverrides[coordinator.id]
                      : (coordinator.assignedGroup || coordinator.group || '');
                    const gType = getMemberGroupType(rawGroup);
                    const isGroupA = gType === 'GROUP_A';
                    const isGroupB = gType === 'GROUP_B';
                    const isUpdating = updatingCoordinatorId === coordinator.id;

                    return (
                      <div key={coordinator.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border-2 border-indigo-100 shrink-0">
                            {coordinator.avatar ? (
                              <img src={coordinator.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <User size={24} className="m-auto mt-3 text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col text-right">
                            <h4 className="font-black text-slate-800 text-base">
                              {coordinator.firstName} {coordinator.lastName}
                            </h4>
                            <span className="text-xs font-bold text-slate-400">{coordinator.email}</span>
                            <div className="mt-1">
                              {isGroupA ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs font-black rounded-lg">
                                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                  רכז קבוצה א׳
                                </span>
                              ) : isGroupB ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black rounded-lg">
                                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                                  רכז קבוצה ב׳
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black rounded-lg">
                                  טרם שוייך לקבוצה
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Exclusive Single Group Selection Buttons with Distinct Grayout */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-500">שיוך לקבוצה:</span>
                          <div className="flex gap-2 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/80">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => requestCoordinatorGroupChange(coordinator, 'קבוצה א\'')}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                isGroupA
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105 ring-2 ring-blue-400'
                                  : isGroupB
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200/60 opacity-40 grayscale hover:opacity-90 hover:grayscale-0'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                              title="שייך רכז בלעדית לקבוצה א׳"
                            >
                              <span className={`w-2.5 h-2.5 rounded-full ${isGroupA ? 'bg-white ring-2 ring-white/30' : isGroupB ? 'bg-slate-300' : 'bg-blue-400'}`} />
                              <span>קבוצה א׳</span>
                              {isGroupA && <Check size={14} className="stroke-[3]" />}
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => requestCoordinatorGroupChange(coordinator, 'קבוצה ב\'')}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                isGroupB
                                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105 ring-2 ring-purple-400'
                                  : isGroupA
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200/60 opacity-40 grayscale hover:opacity-90 hover:grayscale-0'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-50 hover:text-purple-700'
                              }`}
                              title="שייך רכז בלעדית לקבוצה ב׳"
                            >
                              <span className={`w-2.5 h-2.5 rounded-full ${isGroupB ? 'bg-white ring-2 ring-white/30' : isGroupA ? 'bg-slate-300' : 'bg-purple-400'}`} />
                              <span>קבוצה ב׳</span>
                              {isGroupB && <Check size={14} className="stroke-[3]" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {coordinators.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
                      לא נמצאו רכזים פעילים במערכת.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'STAFF_INFO' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 p-6 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800">מדריכים וצוות עמותה – פעילות רוחבית</h3>
                      <p className="text-xs font-bold text-slate-600">
                        בהתאם לנהלי העמותה: <strong>מדריכים</strong> ו<strong>צוות עמותה</strong> אינם משוייכים לקבוצה ספציפית ואינם משתתפים כחבל זוג. הם פועלים רוחבית בכל הסשנים והקבוצות.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                    <UserCheck size={18} className="text-emerald-600" />
                    רשימת מדריכים וצוות עמותה פעילים ({generalStaff.length})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {generalStaff.map(staffMember => (
                      <div key={staffMember.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                          {staffMember.avatar ? (
                            <img src={staffMember.avatar} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <User size={16} className="m-auto mt-2 text-slate-400" />
                          )}
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-xs font-black text-slate-800">{staffMember.firstName} {staffMember.lastName}</span>
                          <span className="text-[10px] font-bold text-emerald-700">{translateRole(staffMember.role)} • רוחבי</span>
                        </div>
                      </div>
                    ))}

                    {generalStaff.length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400 text-xs font-bold">
                        אין מדריכים או אנשי צוות עמותה להצגה.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated In-App Confirmation Dialog for Unlinking */}
          <AnimatePresence>
            {pairToUnlink && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => !isUnlinking && setPairToUnlink(null)}
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center border border-slate-100 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                  dir="rtl"
                >
                  <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                    <Unlink size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">הפרדת חבל זוג</h4>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      האם לנתק את הזוגיות בין <strong className="text-slate-700">{pairToUnlink.a.firstName} {pairToUnlink.a.lastName}</strong> לבין <strong className="text-slate-700">{pairToUnlink.b.firstName} {pairToUnlink.b.lastName}</strong>?
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setPairToUnlink(null)}
                      disabled={isUnlinking}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      ביטול
                    </button>
                    <button
                      onClick={confirmUnlink}
                      disabled={isUnlinking}
                      className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      {isUnlinking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          מנתק...
                        </>
                      ) : (
                        'כן, נתק זוג'
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Dedicated In-App Confirmation Dialog for Group Change */}
          <AnimatePresence>
            {pendingGroupChange && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setPendingGroupChange(null)}
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-sm w-full text-center border border-slate-100 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                  dir="rtl"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                    getMemberGroupType(pendingGroupChange.newGroup) === 'GROUP_A'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-purple-50 text-purple-600 border-purple-200'
                  }`}>
                    <Layers size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">אנא אשר את שינוי השיוך</h4>
                    <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed">
                      האם ברצונך להעביר את <strong className="text-slate-900 font-black">{pendingGroupChange.targetName}</strong> ל-
                      <span className={`inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-md text-xs mr-1 ${
                        getMemberGroupType(pendingGroupChange.newGroup) === 'GROUP_A'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {pendingGroupChange.newGroup}
                      </span>
                      ?
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPendingGroupChange(null)}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all min-h-[44px]"
                    >
                      ביטול
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmGroupChange}
                      className={`flex-1 py-3 px-4 rounded-xl text-white font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
                        getMemberGroupType(pendingGroupChange.newGroup) === 'GROUP_A'
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                          : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25'
                      }`}
                    >
                      <Check size={16} className="stroke-[3]" />
                      <span>אישור</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
