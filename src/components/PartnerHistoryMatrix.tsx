import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Phone, Calendar, History, Users, Info, ChevronDown, ChevronUp, Sparkles, User, ExternalLink } from 'lucide-react';
import { Member, CommunityGroup, GroupMembership, PartnerHistoryItem } from '../types';
import { getMemberPartnerMatrix } from '../utils/partnerHistoryUtils';

interface PartnerHistoryMatrixProps {
  member: Member;
  allMembers: Member[];
  groups: CommunityGroup[];
  memberships: GroupMembership[];
  currentCommunityId?: string;
  onSelectMember?: (partnerId: string) => void;
  onContactClick?: (type: 'whatsapp' | 'phone', partner: Member, mobile: string) => void;
}

export const PartnerHistoryMatrix: React.FC<PartnerHistoryMatrixProps> = ({
  member,
  allMembers,
  groups,
  memberships,
  currentCommunityId,
  onSelectMember,
  onContactClick
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const matrix = getMemberPartnerMatrix(
    member,
    allMembers,
    groups,
    memberships,
    currentCommunityId
  );

  const isVolunteer = member.role === 'Volunteer';
  const isParticipant = member.role === 'Member';
  const isStaff = member.role === 'Staff' || member.role === 'Admin' || member.role === 'Instructor' || member.role === 'Support';

  const handlePartnerClick = (partnerId: string) => {
    if (onSelectMember) {
      onSelectMember(partnerId);
    }
  };

  return (
    <div className="w-full mt-4 flex flex-col gap-3.5 text-right font-sans" dir="rtl">
      
      {/* 1. Active Rope Partner (Current Cohort) - ONLY for active cohorts */}
      {matrix.currentPartner ? (
        <div className="w-full p-4 bg-gradient-to-br from-amber-50/95 via-orange-50/70 to-amber-100/80 border-2 border-amber-300/80 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">🪢</span>
              <div>
                <h4 className="text-amber-950 text-sm font-black flex items-center gap-1.5">
                  חבל זוג פעיל • {matrix.currentCohortName}
                </h4>
                <p className="text-[11px] font-bold text-amber-800">
                  שנת פעילות אישית (ספטמבר - יולי) • ציוות 1-על-1
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black shrink-0">
              פעיל כעת
            </span>
          </div>

          {/* Partner Card Box */}
          <div 
            onClick={() => handlePartnerClick(matrix.currentPartner!.id)}
            className="flex items-center justify-between gap-3 bg-white/95 hover:bg-white p-3 rounded-xl border border-amber-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-100 border-2 border-amber-300 shrink-0 shadow-2xs relative">
                {matrix.currentPartner.avatar ? (
                  <img 
                    src={matrix.currentPartner.avatar} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-700 font-black text-sm">
                    {matrix.currentPartner.firstName?.charAt(0) || '👤'}
                  </div>
                )}
              </div>
              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h5 className="font-black text-slate-900 text-sm group-hover:text-amber-900 transition-colors">
                    {matrix.currentPartner.firstName} {matrix.currentPartner.lastName}
                  </h5>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100/70 text-amber-800 border border-amber-200">
                    {isVolunteer ? 'משתתף שלווה' : 'מתנדב מלווה'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {matrix.currentPartner.mobile || matrix.currentPartner.email}
                </p>
              </div>
            </div>

            {/* Quick Contact Actions */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {matrix.currentPartner.mobile && onContactClick && (
                <>
                  <button
                    onClick={() => onContactClick('whatsapp', matrix.currentPartner!, matrix.currentPartner!.mobile)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white rounded-xl border border-emerald-200 transition-colors shadow-2xs"
                    title="שליחת וואטסאפ"
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button
                    onClick={() => onContactClick('phone', matrix.currentPartner!, matrix.currentPartner!.mobile)}
                    className="p-2 bg-sky-50 hover:bg-sky-500 text-sky-700 hover:text-white rounded-xl border border-sky-200 transition-colors shadow-2xs"
                    title="שיחה טלפונית"
                  >
                    <Phone size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : matrix.isAlumni ? (
        /* Alumni Group Card - Homogeneous, unlinked rope partner */
        <div className="w-full p-4 bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-indigo-100/70 border border-indigo-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🎓</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-indigo-950 text-sm font-black">
                  קבוצת הבוגרים — פעילות הומוגנית מתמשכת
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black border border-indigo-200">
                  ללא חלוקה לזוגות
                </span>
              </div>
              <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                עם סיום שנת חבל זוג, החברים עוברים לקבוצת הבוגרים כקהילה אחת מגובשת. הפעילות אינה מסתיימת בסוף שנה אלא ממשיכה ברצף מדי ספטמבר (לאחר פגרת הקיץ). חבלי הזוג מהמחזור נשמרים בהיסטוריה לצמיתות.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Rope Partner Matrix & History Section (מטריצת חבלי זוג לאורך השנים) */}
      <div className="w-full p-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
              <History size={16} />
            </div>
            <div>
              <h4 className="text-slate-900 text-xs sm:text-sm font-black flex items-center gap-1.5">
                {isVolunteer 
                  ? `היסטוריית ליווי משתתפים (${matrix.totalPartnersCount})`
                  : isParticipant
                  ? `שותפי חבל זוג לאורך השנים (${matrix.totalPartnersCount})`
                  : `מטריצת חבלי זוג וציוותים (${matrix.totalPartnersCount})`}
              </h4>
              <p className="text-[10px] font-bold text-slate-500">
                {matrix.roleDescription}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50/80 px-2 py-1 rounded-lg border border-sky-200/60 transition-colors cursor-pointer"
          >
            <Info size={12} />
            <span>איך זה עובד?</span>
            {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Expandable Explanation of the Habal Zug Cycle Architecture */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 font-black text-slate-900">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>עקרונות שנת חבל זוג וקבוצת הבוגרים:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pr-1">
                  <li>
                    <strong>שנת חבל זוג (מחזור פעילות):</strong> פעילות שנתית (ספטמבר עד יולי). כל מתנדב מצוות אישית 1-על-1 למשתתף ומלווה אותו לאורך כל השנה.
                  </li>
                  <li>
                    <strong>סיום שנת הפעילות ומעבר לבוגרים:</strong> בסוף יולי כל המחזור עובר לקבוצת הבוגרים. חבל הזוג בין המתנדב למשתתף מנותק, וקבוצת הבוגרים פועלת כקבוצה הומוגנית ללא זוגות.
                  </li>
                  <li>
                    <strong>רצף פעילות:</strong> הבוגרים ממשיכים ברצף שנה אחר שנה (עם פגרה ביולי-אוגוסט וחזרה בספטמבר עם הבוגרים החדשים).
                  </li>
                  <li>
                    <strong>צבירת היסטוריה:</strong> מתנדב לאורך השנים צובר מספר בני זוג (משתתף שונה בכל מחזור), בעוד שלמשתתף יש בדרך כלל בן זוג יחיד שליווה אותו (אלא אם הפך בעצמו למתנדב).
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Matrix of Cohort Partnerships */}
        {matrix.history.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {matrix.history.map((item, idx) => {
              const partnerObj = allMembers.find(m => m.id === item.partnerId);
              const isActive = item.status === 'active';
              return (
                <div
                  key={item.id || idx}
                  onClick={() => handlePartnerClick(item.partnerId)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                    isActive 
                      ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/50 shadow-2xs' 
                      : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-slate-200 shrink-0 relative shadow-2xs">
                      {partnerObj?.avatar || item.partnerAvatar ? (
                        <img 
                          src={partnerObj?.avatar || item.partnerAvatar} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs">
                          <User size={16} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-slate-900 group-hover:text-sky-700 transition-colors">
                          {partnerObj ? `${partnerObj.firstName} ${partnerObj.lastName}` : item.partnerName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          ({item.partnerRole === 'Volunteer' ? 'מתנדב מלווה' : 'משתתף שלווה'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 flex-wrap">
                        <span className="font-bold text-slate-700">{item.cohortName}</span>
                        <span>•</span>
                        <span>{item.period || 'שנת פעילות'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {isActive ? 'פעיל כעת' : 'מחזור שהושלם 🎓'}
                    </span>
                    <ExternalLink size={13} className="text-slate-400 group-hover:text-sky-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            {isStaff 
              ? 'איש צוות / רכז / מדריך – מלווה את כלל המחזורים ללא חלוקה לזוג בודד' 
              : 'טרם נרשמה היסטוריית חבל זוג עבור משתמש זה'}
          </div>
        )}
      </div>

    </div>
  );
};
