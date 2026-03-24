import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, Calendar } from 'lucide-react';
import { Member, PerformanceScore } from '../../types';
import { db } from '../../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { formatDate, parseDate } from '../../utils/dateUtils';

interface MemberGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
}

const PARAMETERS = [
  { id: 'paddle', label: 'יעילות החתירה' },
  { id: 'positioning', label: 'קריאת גלים' },
  { id: 'takeOff', label: 'Take-off ודרופ' },
  { id: 'style', label: 'זרימה וחיבור' },
  { id: 'turns', label: 'שליטה בציוד' },
  { id: 'stamina', label: 'חוסן מנטלי' },
];

const MemberGradingModal: React.FC<MemberGradingModalProps> = ({ isOpen, onClose, member }) => {
  const { currentUser } = useAuth();
  const { yearConfig, performanceScores, weeklyHistory } = useData();
  const [scores, setScores] = useState<Record<string, number>>({
    paddle: 5, takeOff: 5, turns: 5, positioning: 5, stamina: 5, style: 5
  });
  const [notes, setNotes] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const sessions = useMemo(() => {
    if (!weeklyHistory) return [];
    return weeklyHistory
      .filter(session => session.participantIds?.includes(member.id))
      .sort((a, b) => {
        const dateA = parseDate(a.date)?.getTime() || 0;
        const dateB = parseDate(b.date)?.getTime() || 0;
        return dateB - dateA;
      });
  }, [weeklyHistory, member.id]);

  useEffect(() => {
    if (isOpen && sessions.length > 0 && !selectedEventId) {
      setSelectedEventId(sessions[0].id);
    }
  }, [isOpen, sessions, selectedEventId]);
  const averages = useMemo(() => {
    const defaultScores = {
      count: 0,
      scores: { paddle: '0.0', takeOff: '0.0', turns: '0.0', positioning: '0.0', stamina: '0.0', style: '0.0' }
    };
    
    if (!performanceScores) return defaultScores;
    
    const memberScores = performanceScores.filter(s => {
      if (s.memberId !== member.id) return false;
      if (yearConfig?.startDate) {
        const scoreDate = parseDate(s.date);
        const startDate = parseDate(yearConfig.startDate);
        if (scoreDate && startDate) {
          return scoreDate >= startDate;
        }
        return false; // Exclude scores without a valid date if we are filtering by year
      }
      return true;
    });
    
    if (memberScores.length === 0) return defaultScores;
    
    // Sort scores by date (oldest first) to apply time-weighted average
    const sortedScores = [...memberScores].sort((a, b) => {
      const dateA = parseDate(a.date)?.getTime() || 0;
      const dateB = parseDate(b.date)?.getTime() || 0;
      return dateA - dateB;
    });

    // Calculate total weight (1 for oldest, 2 for next, ..., N for newest)
    const totalWeight = sortedScores.reduce((acc, _, index) => acc + (index + 1), 0);

    const sum = sortedScores.reduce((acc, curr, index) => {
      const weight = index + 1;
      return {
        paddle: acc.paddle + (curr.paddle || 0) * weight,
        takeOff: acc.takeOff + (curr.takeOff || 0) * weight,
        turns: acc.turns + (curr.turns || 0) * weight,
        positioning: acc.positioning + (curr.positioning || 0) * weight,
        stamina: acc.stamina + (curr.stamina || 0) * weight,
        style: acc.style + (curr.style || 0) * weight,
      };
    }, { paddle: 0, takeOff: 0, turns: 0, positioning: 0, stamina: 0, style: 0 });
    
    const count = memberScores.length;
    return {
      count,
      scores: {
        paddle: (sum.paddle / totalWeight).toFixed(1),
        takeOff: (sum.takeOff / totalWeight).toFixed(1),
        turns: (sum.turns / totalWeight).toFixed(1),
        positioning: (sum.positioning / totalWeight).toFixed(1),
        stamina: (sum.stamina / totalWeight).toFixed(1),
        style: (sum.style / totalWeight).toFixed(1),
      }
    };
  }, [performanceScores, member.id, yearConfig]);

  useEffect(() => {
    const fetchExistingScore = async () => {
      if (!isOpen || !selectedEventId) return;
      setLoading(true);
      const scoreId = `${member.id}_${selectedEventId}`;
      const scoreDoc = await getDoc(doc(db, 'performance_scores', scoreId));
      
      if (scoreDoc.exists()) {
        const data = scoreDoc.data() as PerformanceScore;
        setScores({
          paddle: data.paddle,
          takeOff: data.takeOff,
          turns: data.turns,
          positioning: data.positioning,
          stamina: data.stamina,
          style: data.style,
        });
      } else {
        setScores({ paddle: 5, takeOff: 5, turns: 5, positioning: 5, stamina: 5, style: 5 });
      }
      setLoading(false);
    };
    fetchExistingScore();
  }, [isOpen, member.id, selectedEventId]);

  const handleSave = async () => {
    if (!currentUser || !selectedEventId) return;
    setIsSaving(true);
    const scoreId = `${member.id}_${selectedEventId}`;
    const selectedSession = sessions.find(s => s.id === selectedEventId);
    const sessionDate = selectedSession?.date ? parseDate(selectedSession.date) : new Date();
    
    const scoreData: PerformanceScore = {
      id: scoreId,
      memberId: member.id,
      eventId: selectedEventId,
      date: selectedSession?.date || new Date().toISOString(),
      month: sessionDate ? sessionDate.getMonth() + 1 : new Date().getMonth() + 1,
      year: sessionDate ? sessionDate.getFullYear() : new Date().getFullYear(),
      paddle: scores.paddle,
      takeOff: scores.takeOff,
      turns: scores.turns,
      positioning: scores.positioning,
      stamina: scores.stamina,
      style: scores.style,
      instructorId: currentUser.uid || '',
      instructorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'performance_scores', scoreId), scoreData);
    setIsSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#FDFDFD] text-slate-800 rounded-[2rem] p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-white relative"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f4f7f6 100%)'
            }}
          >
            {/* Micro-grain texture overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" 
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
            ></div>

            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 p-2 rounded-full z-50 shadow-sm border border-slate-100"
              title="סגור"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6 mt-2 relative z-10">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">הערכה ל-{member.firstName} {member.lastName}</h2>
            </div>

            <div className="flex flex-col items-center mb-6 relative z-10">
              <img 
                src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName + ' ' + member.lastName)}&background=0ea5e9&color=fff`} 
                alt={`${member.firstName} ${member.lastName}`}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-[0_10px_25px_-5px_rgba(14,165,233,0.3)] mb-4"
                referrerPolicy="no-referrer"
              />
              
              {averages && (
                <div className="w-full p-4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60">
                  <h3 className="text-xs font-black text-sky-600 mb-3 uppercase tracking-widest text-center">
                    הערכות ממוצעות (מבוסס על {averages.count} סשנים)
                  </h3>
                  <div className="grid grid-cols-6 gap-2 text-center">
                    {PARAMETERS.map(p => (
                      <div key={p.id} className="flex flex-col items-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{p.label.split(' ')[0]}</div>
                        <div className="text-xl font-black text-slate-800">{(averages.scores as any)[p.id]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-12 relative z-10">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-slate-400" size={28} />
                </div>
                <p className="text-slate-500 text-lg mb-8 font-medium">חבר זה טרם השתתף בסשנים ולכן לא ניתן להזין לו הערכה.</p>
                <button 
                  onClick={onClose}
                  className="px-10 py-3.5 bg-white text-slate-700 rounded-xl font-black hover:bg-slate-50 transition-all shadow-sm border border-slate-200 hover:shadow-md"
                >
                  סגור
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">בחר סשן:</label>
                  <select 
                    value={selectedEventId} 
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 text-slate-800 font-bold shadow-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  >
                    {sessions.map(session => (
                      <option key={session.id} value={session.id}>סשן גלישה - {formatDate(session.date)}</option>
                    ))}
                  </select>
                </div>

                {loading ? <Loader2 className="animate-spin mx-auto text-sky-500" size={48} /> : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PARAMETERS.map(param => (
                        <div key={param.id} className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]">
                          <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">{param.label}</label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="range" min="0" max="10" value={scores[param.id]}
                              onChange={(e) => setScores({...scores, [param.id]: parseInt(e.target.value)})}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                            <span className="text-2xl font-black text-sky-500 w-8 text-center">{scores[param.id]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <textarea 
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl mt-2 text-slate-800 shadow-inner focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none min-h-[80px]"
                      placeholder="הערות נוספות (אופציונלי)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />

                    <div className="flex gap-4 mt-6">
                      <button 
                        onClick={onClose}
                        className="w-1/3 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-lg hover:bg-slate-200 transition-colors"
                      >
                        ביטול
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-2/3 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={24} /> שמור הערכה</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MemberGradingModal;
