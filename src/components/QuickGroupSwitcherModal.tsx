import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Check, 
  X, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Waves, 
  GraduationCap, 
  MousePointerClick, 
  Smartphone,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { AVAILABLE_COMMUNITIES, Community, canSwitchAllCommunities } from '../constants';

export const QuickGroupSwitcherModal: React.FC = () => {
  const { currentUser, currentCommunityId, switchCommunity, isAuthenticated } = useAuth();
  const { availableCommunities: ctxCommunities, memberships } = useData();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'adults'>('all');

  const communities = ctxCommunities || AVAILABLE_COMMUNITIES;
  const activeCommId = currentCommunityId || 'herzliya';

  // Permission check
  const hasFullAccess = canSwitchAllCommunities(currentUser);

  // Compute allowed communities for the current user
  const allowedCommunities = useMemo(() => {
    if (!currentUser) return [];

    // Privileged roles can switch across ALL communities
    if (hasFullAccess) {
      return communities;
    }

    // Regular members can ONLY switch between communities they belong to
    const userCommunityIds = new Set<string>();

    // 1. Check user.communities array on member doc
    if (Array.isArray(currentUser.communities)) {
      currentUser.communities.forEach(id => userCommunityIds.add(id));
    }

    // 2. Check group_memberships
    if (Array.isArray(memberships) && currentUser.id) {
      memberships.forEach(m => {
        if (m.personId === currentUser.id && m.groupId) {
          userCommunityIds.add(m.groupId);
        }
      });
    }

    // 3. Fallback to active community if set, or default
    if (activeCommId) {
      userCommunityIds.add(activeCommId);
    }
    if (userCommunityIds.size === 0) {
      userCommunityIds.add('herzliya');
    }

    return communities.filter(c => userCommunityIds.has(c.id));
  }, [currentUser, communities, memberships, activeCommId, hasFullAccess]);

  // Touch Long-Press Listener & Desktop Right-Click Listener
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    // 1. Right Click (Desktop / Laptops context menu)
    const handleContextMenu = (e: MouseEvent) => {
      // Do not intercept right click inside inputs or textareas to preserve native copy/paste
      const target = e.target as HTMLElement | null;
      if (target && target.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      e.preventDefault();
      setIsOpen(true);
      setSearchTerm('');
    };

    // 2. Touch Long Press (Mobile / Tablet devices)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const target = e.target as HTMLElement | null;
      if (target && target.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      isLongPressActiveRef.current = false;

      // Start 500ms long press timer
      touchTimerRef.current = setTimeout(() => {
        isLongPressActiveRef.current = true;
        
        // Haptic feedback if supported by browser/device
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(40);
          } catch (_) {
            // Ignore if vibration permissions are restricted
          }
        }

        setIsOpen(true);
        setSearchTerm('');
      }, 500);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPosRef.current || !touchTimerRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);

      // Cancel long press if finger moved more than 12px (scrolling/panning)
      if (deltaX > 12 || deltaY > 12) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    };

    const handleTouchEnd = () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, [isAuthenticated, currentUser]);

  // Keyboard Escape listener to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered list
  const filteredCommunities = useMemo(() => {
    return allowedCommunities.filter(c => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term || 
        c.name.toLowerCase().includes(term) ||
        (c.baseName ? c.baseName.toLowerCase().includes(term) : false);

      const matchesType = 
        filterType === 'all' || 
        (filterType === 'adults' && c.isAdults) || 
        (filterType === 'active' && !c.isAdults);

      return matchesSearch && matchesType;
    });
  }, [allowedCommunities, searchTerm, filterType]);

  const handleSelectCommunity = (commId: string) => {
    switchCommunity(commId);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const getRoleBadge = () => {
    if (!currentUser) return null;
    const role = currentUser.role;
    const isAppShaper = role === 'Support' || currentUser.email?.toLowerCase() === 'yuval.shalev@gmail.com';

    if (isAppShaper) {
      return (
        <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-black flex items-center gap-1.5 border border-blue-200">
          <Sparkles size={12} className="text-blue-600" /> אפ-שייפר • מעבר חופשי
        </span>
      );
    }
    if (role === 'Admin') {
      return (
        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black flex items-center gap-1.5 border border-amber-200">
          <ShieldCheck size={12} className="text-amber-700" /> רכז קהילה • מעבר חופשי
        </span>
      );
    }
    if (role === 'Instructor') {
      return (
        <span className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded-full text-xs font-black flex items-center gap-1.5 border border-purple-200">
          <Waves size={12} className="text-purple-700" /> מדריך מוסמך • מעבר חופשי
        </span>
      );
    }
    if (role === 'Staff') {
      return (
        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-black flex items-center gap-1.5 border border-indigo-200">
          <ShieldCheck size={12} className="text-indigo-700" /> צוות עמותה • מעבר חופשי
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-black flex items-center gap-1.5 border border-slate-200">
        <Lock size={12} className="text-slate-500" /> חבר קהילה • קבוצות מורשות
      </span>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-slate-900/65 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-[#00426a] to-slate-900 text-white relative shrink-0">
            {/* Background texture & soft glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sky-300">
                    <Users size={18} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight font-yehuda">
                    מעבר מהיר בין קבוצות
                  </h2>
                  {getRoleBadge()}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  בחר קבוצה למעבר מיידי של כלל המידע, הלוח והפעילויות.
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
                title="סגירה (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* Search box */}
              <div className="relative flex-1">
                <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חיפוש קבוצה או סניף..."
                  className="w-full pr-10 pl-3 py-2 bg-white/10 border border-white/15 focus:border-sky-400 focus:bg-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              {hasFullAccess && (
                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                      filterType === 'all' 
                        ? 'bg-white text-[#00426a] shadow-xs' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    הכל ({allowedCommunities.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('active')}
                    className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                      filterType === 'active' 
                        ? 'bg-white text-[#00426a] shadow-xs' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    מחזורים פעילים
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('adults')}
                    className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                      filterType === 'adults' 
                        ? 'bg-white text-[#00426a] shadow-xs' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    בוגרים
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Communities Grid / List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/60">
            {filteredCommunities.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm">לא נמצאו קבוצות תואמות לחיפוש</p>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-xs text-sky-600 hover:underline font-bold"
                >
                  נקה חיפוש
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCommunities.map((comm) => {
                  const isActive = comm.id === activeCommId;

                  return (
                    <button
                      key={comm.id}
                      type="button"
                      onClick={() => handleSelectCommunity(comm.id)}
                      className={`relative flex items-center justify-between p-4 rounded-2xl border text-right transition-all cursor-pointer active:scale-[0.98] ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/15 border-emerald-400 shadow-md ring-2 ring-emerald-400/30'
                          : 'bg-white border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/40 hover:shadow-sm text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Icon */}
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                            : comm.isAdults
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            : 'bg-sky-50 text-sky-600 border border-sky-100'
                        }`}>
                          {comm.isAdults ? (
                            <GraduationCap size={20} />
                          ) : (
                            <Waves size={20} />
                          )}
                        </div>

                        {/* Name and Meta */}
                        <div className="min-w-0">
                          <h4 className={`text-sm sm:text-base font-black truncate font-yehuda ${
                            isActive ? 'text-emerald-950 font-black' : 'text-slate-900'
                          }`}>
                            {comm.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {comm.baseName && (
                              <>
                                <span className="text-[11px] font-bold text-slate-400">
                                  סניף {comm.baseName}
                                </span>
                                <span className="text-slate-300">•</span>
                              </>
                            )}
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              comm.isAdults 
                                ? 'bg-indigo-100/70 text-indigo-800' 
                                : 'bg-sky-100/70 text-sky-800'
                            }`}>
                              {comm.isAdults ? 'בוגרים' : 'מחזור פעיל'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Active check indicator or switch chevron */}
                      <div className="shrink-0 mr-2">
                        {isActive ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs">
                            <Check size={14} />
                            <span>פעיל עכשיו</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-sky-100 text-slate-400 hover:text-sky-600 flex items-center justify-center transition-colors">
                            <ChevronLeft size={16} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!hasFullAccess && allowedCommunities.length === 1 && (
              <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
                <Lock size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>לתשומת לבך:</strong> כמשתתף/ת בקבוצה, חשבונך משויך ל־{allowedCommunities[0].name}. רכזים, מדריכים וצוות עמותה מורשים לעבור חופשית בין כלל הסניפים והמחזורים.
                </span>
              </div>
            )}
          </div>

          {/* Footer Shortcuts Info */}
          <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                <Smartphone size={13} className="text-sky-600" />
                <span>נגיעה ארוכה במסך (מובייל/טאבלט)</span>
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                <MousePointerClick size={13} className="text-purple-600" />
                <span>לחיצה על הכפתור הימני בעכבר (מחשב)</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-colors cursor-pointer"
            >
              סגור (Esc)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
