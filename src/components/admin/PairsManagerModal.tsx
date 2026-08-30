import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Link2, Unlink, User, UserPlus, Users, ChevronDown, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Member } from '../../types';
import { useData } from '../../contexts/DataContext';

interface PairsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members?: Member[];
  onUpdateMember?: (member: Member) => Promise<void>;
  onLinkPair?: (memberAId: string, memberBId: string) => Promise<void>;
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberA, setSelectedMemberIdA] = useState<string>('');
  const [selectedMemberB, setSelectedMemberIdB] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [pairToUnlink, setPairToUnlink] = useState<{ a: Member; b: Member } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active members only
  const activeMembers = useMemo(() => members.filter(m => m.isActive !== false), [members]);

  // Derived pairs list
  const pairs = useMemo(() => {
    const pairsMap = new Map<string, { a: Member, b: Member }>();
    const seenIds = new Set<string>();

    activeMembers.forEach(m => {
      if (m.partnerId && !seenIds.has(m.id)) {
        const partner = activeMembers.find(p => p.id === m.partnerId);
        if (partner) {
          seenIds.add(m.id);
          seenIds.add(partner.id);
          pairsMap.set(`${m.id}-${partner.id}`, { a: m, b: partner });
        }
      }
    });
    return Array.from(pairsMap.values());
  }, [activeMembers]);

  // Available for pairing (unpaired active members)
  const unpairedMembers = useMemo(() => activeMembers.filter(m => !m.partnerId), [activeMembers]);
  // Only Volunteer can be paired with Member - Admin, Staff, Support and Instructor are strictly excluded
  const unpairedVolunteers = useMemo(() => unpairedMembers.filter(m => m.role === 'Volunteer'), [unpairedMembers]);
  const unpairedParticipants = useMemo(() => unpairedMembers.filter(m => m.role === 'Member'), [unpairedMembers]);

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
          setFeedbackMsg({ 
            type: 'error', 
            text: 'חבל זוג מתאפשר אך ורק בין מתנדב למשתתף. רכזים, צוות עמותה ומדריכים אינם יכולים להיות בני זוג.' 
          });
          setTimeout(() => setFeedbackMsg(null), 4000);
          setIsLinking(false);
          return;
        }

        if (contextLinkPair) {
          await contextLinkPair(memberA.id, memberB.id);
        } else if (contextUpdateMember) {
          await contextUpdateMember({ ...memberA, partnerId: memberB.id });
          await contextUpdateMember({ ...memberB, partnerId: memberA.id });
        }

        setSelectedMemberIdA('');
        setSelectedMemberIdB('');
        setFeedbackMsg({ type: 'success', text: `נוצר חבל זוג בין ${memberA.firstName} ל${memberB.firstName} בהצלחה!` });
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (e: any) {
      console.error(e);
      setFeedbackMsg({ type: 'error', text: e?.message || 'שגיאה ביצירת צמד, אנא נסה שוב.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setIsLinking(false);
    }
  };

  const confirmUnlink = async () => {
    if (!pairToUnlink) return;
    setIsUnlinking(true);
    try {
      if (contextUnlinkPair) {
        await contextUnlinkPair(pairToUnlink.a.id, pairToUnlink.b.id);
      } else if (contextUpdateMember) {
        const updatedA = { ...pairToUnlink.a, partnerId: '' };
        const updatedB = { ...pairToUnlink.b, partnerId: '' };
        await contextUpdateMember(updatedA);
        await contextUpdateMember(updatedB);
      }
      
      const nameA = pairToUnlink.a.firstName;
      const nameB = pairToUnlink.b.firstName;
      setPairToUnlink(null);
      setFeedbackMsg({ type: 'success', text: `חבל הזוג בין ${nameA} ל${nameB} נותק בהצלחה!` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e) {
      console.error(e);
      setFeedbackMsg({ type: 'error', text: 'שגיאה בניתוק הזוג, אנא נסה שוב.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setIsUnlinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
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
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-[var(--surfer-aqua-mist)]/20 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[var(--surfer-vibrant-cyan)] shadow-sm">
                <Link2 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">ניהול זוגות - חבל זוג</h2>
                <p className="text-sm font-bold text-slate-500">חבר בין מתנדב למשתתף לליווי צמוד במים</p>
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

          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
            {/* Create Pair Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-2">
                <UserPlus size={20} className="text-indigo-500" />
                יצירת זוג חדש
              </h3>
              <div className="flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-2">מתנדב</label>
                  <CustomMemberSelect
                    value={selectedMemberA}
                    onChange={(val) => setSelectedMemberIdA(val)}
                    options={unpairedVolunteers}
                    placeholder="בחר מתנדב/ת..."
                  />
                </div>
                
                <div className="flex items-center justify-center pb-3 text-slate-300">
                  <Link2 size={24} />
                </div>
                
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-2">משתתף</label>
                  <CustomMemberSelect
                    value={selectedMemberB}
                    onChange={(val) => setSelectedMemberIdB(val)}
                    options={unpairedParticipants}
                    placeholder="בחר משתתפ/ת..."
                  />
                </div>
                
                <button
                  onClick={handleLink}
                  disabled={!selectedMemberA || !selectedMemberB || selectedMemberA === selectedMemberB || isLinking}
                  className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
                >
                  {isLinking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      מחבר...
                    </>
                  ) : (
                    'חבר זוג'
                  )}
                </button>
              </div>
            </div>

            {/* Existing Pairs Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                  <Users size={20} className="text-[var(--surfer-electric-pink)]" />
                  זוגות קיימים ({pairs.length})
                </h3>
                
                <div className="relative">
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="חיפוש בזוגות..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[var(--surfer-vibrant-cyan)] w-full sm:w-64 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pairs
                  .filter(p => 
                    (p.a.firstName + ' ' + p.a.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.b.firstName + ' ' + p.b.lastName).toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((pair, idx) => {
                    const isPairCompliant = 
                      (pair.a.role === 'Volunteer' && pair.b.role === 'Member') ||
                      (pair.a.role === 'Member' && pair.b.role === 'Volunteer');

                    return (
                      <div key={idx} className={`bg-white rounded-2xl border ${isPairCompliant ? 'border-slate-200' : 'border-amber-300 bg-amber-50/20'} p-4 flex flex-col gap-2 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}>
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
                            
                            {/* Link Icon */}
                            <div className="flex flex-col items-center justify-center text-[var(--surfer-vibrant-cyan)] shrink-0 px-1">
                              <Link2 size={20} />
                              <span className="text-[9px] font-bold tracking-wider uppercase mt-0.5 text-slate-400">חבל זוג</span>
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
                          
                          {/* Unlink Action Button */}
                          <button 
                            onClick={() => setPairToUnlink(pair)}
                            className="w-11 h-11 flex items-center justify-center text-rose-500 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100 active:scale-90 border border-rose-200/80 rounded-xl transition-all shrink-0 mr-2 shadow-xs"
                            title={`הפרד את ${pair.a.firstName} ו${pair.b.firstName}`}
                            aria-label={`הפרד את ${pair.a.firstName} ו${pair.b.firstName}`}
                          >
                            <Unlink size={20} className="stroke-[2.2]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                
                {pairs.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
                    לא הוגדרו עדיין זוגות במערכת. השתמש בטופס למעלה כדי ליצור את הזוג הראשון.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dedicated In-App Confirmation Dialog for Unlinking (No window.confirm!) */}
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
