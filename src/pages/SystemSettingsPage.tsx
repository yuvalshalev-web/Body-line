import React, { useState, useRef, useEffect } from 'react';
import { BranchCohortConfig, BranchGroupConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Terminal, Calendar, MapPin, Globe, Timer, Hourglass, 
  Clock, Plus, Trash2, Edit2, CheckCircle2, ShieldAlert, AlertTriangle, 
  FileText, Map as MapIcon, Users, Check, X, Loader2, Save, Eye,
  Layers, Activity, ArrowRight, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { SUPER_ADMIN_EMAIL, isAppShaperUser, isAdminUser, BASE_COMMUNITY_BRANCHES, DEFAULT_BRANCH_COHORTS, getBranchCohortName } from '../constants';
import { loadGoogleMaps, extractAddressData } from '../utils/googlePlaces';
import { DayPicker } from '../components/DayPicker';
import { TimePicker } from '../components/TimePicker';
import { MarkdownViewer } from '../components/admin/MarkdownViewer';
import { ReadOnlyNoticeModal } from '../components/admin/ReadOnlyNoticeModal';

interface SystemSettingsPageProps {
  embedded?: boolean;
}

const DAYS_OF_WEEK = [
  { id: 0, he: 'ראשון' },
  { id: 1, he: 'שני' },
  { id: 2, he: 'שלישי' },
  { id: 3, he: 'רביעי' },
  { id: 4, he: 'חמישי' },
  { id: 5, he: 'שישי' },
  { id: 6, he: 'שבת' },
];

export const SystemSettingsPage: React.FC<SystemSettingsPageProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showAlert, showConfirm, showSuccess, showError } = useModal();
  const { 
    siteConfig, updateSiteConfig, 
    yearConfig, updateYearConfig, 
    conflictingAdmins, updateMember, deleteMember, members 
  } = useData();

  const isCoordinator = currentUser?.role === 'Admin' || currentUser?.role === 'Staff';
  const isAppShaper = isAppShaperUser(currentUser) || currentUser?.role === 'Support' || currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const canManageSystem = true;
  const [showReadOnlyNotice, setShowReadOnlyNotice] = useState(false);

  // Selected branch for managing its groups
  const [selectedBranchId, setSelectedBranchId] = useState<string>(BASE_COMMUNITY_BRANCHES[0].id);

  // Year & Branch Cohorts Configuration State
  const [branchCohortsState, setBranchCohortsState] = useState<Record<string, BranchCohortConfig>>({
    ...DEFAULT_BRANCH_COHORTS
  });
  const [isSaving, setIsSaving] = useState(false);

  // Group editing modal state
  const [editingGroup, setEditingGroup] = useState<{ branchId: string; group: BranchGroupConfig | null; isNew: boolean } | null>(null);
  const [groupForm, setGroupForm] = useState<BranchGroupConfig>({
    id: '',
    name: '',
    type: 'cohort',
    startDate: '2026-09-01',
    endDate: '2027-07-31',
    dayOfWeek: 4,
    startTime: '07:00',
    sessionDurationMinutes: 90
  });

  useEffect(() => {
    if (yearConfig?.branchCohorts) {
      // Merge with defaults
      const merged: Record<string, BranchCohortConfig> = { ...DEFAULT_BRANCH_COHORTS };
      for (const [k, v] of Object.entries(yearConfig.branchCohorts)) {
        if (typeof v === 'object' && v !== null) {
          merged[k] = {
            ...(merged[k] || {}),
            ...v,
            groups: v.groups && v.groups.length > 0 ? v.groups : (merged[k]?.groups || [])
          };
        }
      }
      setBranchCohortsState(merged);
    }
  }, [yearConfig]);

  const handleSaveAllBranchSettings = async () => {
    setIsSaving(true);
    try {
      await updateYearConfig({
        name: yearConfig?.name || 'מחזור ז׳',
        startDate: yearConfig?.startDate || '2026-09-01',
        endDate: yearConfig?.endDate || '2027-07-31',
        activityMode: yearConfig?.activityMode || 'משותפת',
        branchCohorts: branchCohortsState
      });
      showSuccess('הגדרות המיקומים והקבוצות עודכנו בהצלחה!');
    } catch (err) {
      console.error(err);
      showError('שגיאה בשמירת ההגדרות');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAddGroup = (branchId: string) => {
    setGroupForm({
      id: 'g_' + Date.now(),
      name: 'קבוצה חדשה',
      type: 'cohort',
      startDate: '2026-09-01',
      endDate: '2027-07-31',
      dayOfWeek: 4,
      startTime: '07:00',
      sessionDurationMinutes: 90
    });
    setEditingGroup({ branchId, group: null, isNew: true });
  };

  const handleOpenEditGroup = (branchId: string, group: BranchGroupConfig) => {
    setGroupForm({ ...group });
    setEditingGroup({ branchId, group, isNew: false });
  };

  const handleSaveGroupModal = () => {
    if (!editingGroup) return;
    const { branchId, isNew } = editingGroup;
    const currentBranch = branchCohortsState[branchId] || { name: 'מחזור', startDate: '2026-09-01', endDate: '2027-07-31', groups: [] };
    const existingGroups = currentBranch.groups || [];

    let updatedGroups: BranchGroupConfig[];
    if (isNew) {
      updatedGroups = [...existingGroups, groupForm];
    } else {
      updatedGroups = existingGroups.map(g => g.id === groupForm.id ? groupForm : g);
    }

    const updatedBranchCohorts = {
      ...branchCohortsState,
      [branchId]: {
        ...currentBranch,
        groups: updatedGroups
      }
    };

    setBranchCohortsState(updatedBranchCohorts);
    setEditingGroup(null);
    showSuccess('פרטי הקבוצה עודכנו בהצלחה (לחץ על שמור שינויים למטה כדי לעדכן במערכת)');
  };

  const handleDeleteGroup = (branchId: string, groupId: string) => {
    showConfirm({
      title: "מחיקת קבוצה",
      message: "האם אתה בטוח שברצונך למחוק קבוצה זו מהמיקום הגיאוגרפי?",
      confirmText: "כן, מחק",
      cancelText: "ביטול",
      onConfirm: () => {
        const currentBranch = branchCohortsState[branchId];
        if (!currentBranch || !currentBranch.groups) return;
        const updatedGroups = currentBranch.groups.filter(g => g.id !== groupId);
        setBranchCohortsState({
          ...branchCohortsState,
          [branchId]: {
            ...currentBranch,
            groups: updatedGroups
          }
        });
        showSuccess('הקבוצה הוסרה בהצלחה');
      }
    });
  };

  // Duplicate users cleanup & Markdown viewer state
  const [markdownConfig, setMarkdownConfig] = useState<{ isOpen: boolean; path: string; title: string }>({
    isOpen: false,
    path: '',
    title: ''
  });
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [editingConflictId, setEditingConflictId] = useState<string | null>(null);
  const [conflictNewEmail, setConflictNewEmail] = useState('');

  const currentSelectedBranch = BASE_COMMUNITY_BRANCHES.find(b => b.id === selectedBranchId) || BASE_COMMUNITY_BRANCHES[0];
  const currentBranchConfig = branchCohortsState[selectedBranchId] || { name: 'מחזור פעיל', startDate: '', endDate: '', groups: [] };

  return (
    <div className={embedded ? "space-y-10" : "max-w-7xl mx-auto px-4 py-8 space-y-10"}>
      {/* Standalone Back Link if not embedded */}
      {!embedded && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black text-sm px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <ArrowRight size={18} />
            <span>חזרה לפאנל הניהול</span>
          </button>
          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
            <span>פאנל ניהול</span>
            <span>/</span>
            <span className="text-slate-900">הגדרות מערכת ומיקומים</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 text-sky-600 rounded-2xl">
              <MapPin size={26} />
            </div>
            הגדרת מיקומים גיאוגרפים וקבוצות פעילות
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            ניהול סניפים, קבוצות המחזורים וקבוצות הבוגרים — לכל קבוצה סט פרמטרים עצמאי (ימי פעילות, שעות, תאריכים ומשך)
          </p>
        </div>
        <button
          onClick={handleSaveAllBranchSettings}
          disabled={isSaving}
          className="px-6 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-500/25 hover:from-sky-600 hover:to-indigo-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          <span>שמור את כל השינויים במערכת</span>
        </button>
      </div>

      {/* Geographic Location (Branch) Tabs / Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Globe size={16} className="text-sky-500" />
            <span>בחר מיקום גיאוגרפי (סניף) לצפייה וניהול קבוצות:</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold">5 מיקומים פעילים בקהילה</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {BASE_COMMUNITY_BRANCHES.map(branch => {
            const isSelected = branch.id === selectedBranchId;
            const groupsCount = (branchCohortsState[branch.id]?.groups || []).length;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranchId(branch.id)}
                className={`p-4 rounded-2xl border transition-all text-right flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected 
                    ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white border-transparent shadow-lg shadow-sky-500/20 scale-102' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-base">{branch.baseName}</span>
                  <MapPin size={18} className={isSelected ? 'text-white/90' : 'text-sky-500'} />
                </div>
                <div className="flex items-center justify-between text-xs font-bold opacity-90">
                  <span>{groupsCount} קבוצות מוגדרות</span>
                  <ChevronLeft size={16} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Geographic Location & Its Independent Groups */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-black rounded-full">מיקום גיאוגרפי פעיל</span>
              <h3 className="text-xl font-black text-slate-900">{currentSelectedBranch.baseName}</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              כל הקבוצות להלן שייכות אך ורק למיקום הגיאוגרפי {currentSelectedBranch.baseName}. לכל קבוצה יש סט פרמטרים עצמאי לחלוטין.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAddGroup(selectedBranchId)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Plus size={16} />
            <span>הוסף קבוצה חדשה ל{currentSelectedBranch.baseName}</span>
          </button>
        </div>

        {/* Groups List for this Location */}
        <div className="space-y-4">
          {(!currentBranchConfig.groups || currentBranchConfig.groups.length === 0) ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Users size={32} className="mx-auto text-slate-400" />
              <p className="text-sm font-black text-slate-700">אין קבוצות מוגדרות עדיין למיקום זה</p>
              <button
                type="button"
                onClick={() => handleOpenAddGroup(selectedBranchId)}
                className="px-4 py-2 bg-sky-500 text-white text-xs font-black rounded-xl"
              >
                הקם קבוצה ראשונה
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentBranchConfig.groups.map(group => {
                const dayName = DAYS_OF_WEEK.find(d => d.id === group.dayOfWeek)?.he || 'חמישי';
                const isAlumni = group.type === 'alumni';
                return (
                  <div 
                    key={group.id} 
                    className={`p-6 rounded-2xl border transition-all space-y-4 relative overflow-hidden ${
                      isAlumni 
                        ? 'bg-gradient-to-br from-indigo-50/50 via-white to-white border-indigo-200 shadow-sm' 
                        : 'bg-gradient-to-br from-sky-50/50 via-white to-white border-sky-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${isAlumni ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'}`}>
                          {isAlumni ? '🎓 קבוצת בוגרים' : '🌊 מחזור פעיל'}
                        </span>
                        <h4 className="text-base font-black text-slate-900">{group.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditGroup(selectedBranchId, group)}
                          className="p-2 bg-white border border-slate-200 text-slate-700 hover:text-sky-600 rounded-xl transition-all cursor-pointer shadow-2xs"
                          title="ערוך פרטי קבוצה"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(selectedBranchId, group.id)}
                          className="p-2 bg-white border border-slate-200 text-slate-700 hover:text-rose-600 rounded-xl transition-all cursor-pointer shadow-2xs"
                          title="מחק קבוצה"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Independent Parameters Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">יום פעילות בשבוע</span>
                        <span className="font-black text-slate-800">יום {dayName}</span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">שעת תחילת פעילות</span>
                        <span className="font-black text-slate-800 flex items-center gap-1">
                          <Clock size={12} className="text-sky-500" />
                          {group.startTime || '07:00'}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">משך פעילות</span>
                        <span className="font-black text-slate-800 flex items-center gap-1">
                          <Timer size={12} className="text-emerald-500" />
                          {group.sessionDurationMinutes || 90} דקות
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-3 bg-white/80 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold">טווח תאריכים פעיל:</span>
                        <span className="font-black text-slate-800 text-[11px]" dir="ltr">
                          {group.startDate || '2026-09-01'} ➔ {group.endDate || '2027-07-31'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Group Edit / Add Modal */}
      <AnimatePresence>
        {editingGroup && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 p-6 text-white text-center relative">
                <Calendar size={36} className="mx-auto mb-2 text-white/90" />
                <h3 className="text-xl font-black mb-1">
                  {editingGroup.isNew ? 'הקמת קבוצה חדשה במיקום' : 'עריכת פרטי קבוצה'}
                </h3>
                <p className="text-sky-100 text-xs font-semibold">הגדרת סט הפרמטרים העצמאי לקבוצה זו</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">שם הקבוצה / המחזור</label>
                  <input 
                    type="text"
                    value={groupForm.name}
                    onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="למשל: מחזור ז׳ או קבוצת בוגרים"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-slate-800 outline-none focus:ring-2 ring-sky-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">סוג הקבוצה</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGroupForm({ ...groupForm, type: 'cohort' })}
                      className={`p-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        groupForm.type === 'cohort' ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🌊 מחזור פעיל (שנת חבל זוג)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupForm({ ...groupForm, type: 'alumni' })}
                      className={`p-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        groupForm.type === 'alumni' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🎓 קבוצת בוגרים
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">תאריך התחלה</label>
                    <input 
                      type="date"
                      value={groupForm.startDate}
                      onChange={e => setGroupForm({ ...groupForm, startDate: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">תאריך סיום</label>
                    <input 
                      type="date"
                      value={groupForm.endDate}
                      onChange={e => setGroupForm({ ...groupForm, endDate: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">יום בשבוע</label>
                    <select
                      value={groupForm.dayOfWeek}
                      onChange={e => setGroupForm({ ...groupForm, dayOfWeek: Number(e.target.value) })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-slate-800 outline-none"
                    >
                      {DAYS_OF_WEEK.map(d => (
                        <option key={d.id} value={d.id}>יום {d.he}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">שעת התחלה</label>
                    <input 
                      type="time"
                      value={groupForm.startTime || '07:00'}
                      onChange={e => setGroupForm({ ...groupForm, startTime: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">משך (דקות)</label>
                    <input 
                      type="number"
                      value={groupForm.sessionDurationMinutes || 90}
                      onChange={e => setGroupForm({ ...groupForm, sessionDurationMinutes: Number(e.target.value) })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={handleSaveGroupModal}
                    className="flex-1 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-2xl font-black text-sm shadow-md hover:from-sky-600 hover:to-indigo-700 transition-all cursor-pointer"
                  >
                    אישור ושמירה בקבוצה
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingGroup(null)}
                    className="px-5 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conflicting Admins Alert */}
      {conflictingAdmins.length > 0 && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 text-rose-800">
            <ShieldAlert size={24} />
            <h3 className="text-base font-black">קיימים {conflictingAdmins.length} מנהלים עם אימייל כפול</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {conflictingAdmins.map((admin: any) => (
              <div key={admin.id} className="p-4 bg-white rounded-xl border border-rose-200 flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-xs font-black text-slate-800">{admin.firstName} {admin.lastName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{admin.email}</p>
                </div>
                {editingConflictId === admin.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="email" 
                      value={conflictNewEmail}
                      onChange={e => setConflictNewEmail(e.target.value)}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold w-40"
                    />
                    <button 
                      onClick={async () => {
                        if (!conflictNewEmail.trim()) return;
                        try {
                          await updateMember({ ...admin, email: conflictNewEmail.trim() });
                          setEditingConflictId(null);
                          showSuccess('אימייל עודכן בהצלחה');
                        } catch (err) {
                          showError('שגיאה בעדכון אימייל');
                        }
                      }}
                      className="p-1.5 bg-emerald-500 text-white rounded-lg"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => setEditingConflictId(null)}
                      className="p-1.5 bg-rose-100 text-rose-600 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setEditingConflictId(admin.id);
                      setConflictNewEmail(admin.email === SUPER_ADMIN_EMAIL ? 'gal@gmail.com' : admin.email);
                    }}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-black hover:bg-rose-200 transition-all cursor-pointer"
                  >
                    תיקון אימייל
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentation Guides */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => navigate('/about')}
          className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 transition-all text-right flex items-center gap-4 cursor-pointer group"
        >
          <div className="p-4 bg-sky-50 text-sky-600 rounded-xl group-hover:bg-sky-500 group-hover:text-white transition-all shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900">מדריך למשתמש ואודות</h4>
            <p className="text-xs text-slate-500 font-medium">מעבר לדף הקהילה, אמנת הפעילות והסברים מלאים על המחזורים</p>
          </div>
        </button>

        <button 
          onClick={() => setMarkdownConfig({ isOpen: true, path: '/PROJECT_MAP.md', title: 'מפת הפרויקט (Project Map)' })}
          className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 transition-all text-right flex items-center gap-4 cursor-pointer group"
        >
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
            <MapIcon size={24} />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900">מפת הפרויקט (Project Map)</h4>
            <p className="text-xs text-slate-500 font-medium">צפייה במבנה הקוד, הרכיבים והארכיטקטורה של המערכת</p>
          </div>
        </button>
      </section>

      {/* Markdown Guide Modal */}
      <MarkdownViewer 
        isOpen={markdownConfig.isOpen}
        onClose={() => setMarkdownConfig(prev => ({ ...prev, isOpen: false }))}
        filePath={markdownConfig.path}
        title={markdownConfig.title}
      />

      {/* Read Only Notice Modal */}
      <ReadOnlyNoticeModal 
        isOpen={showReadOnlyNotice}
        onClose={() => setShowReadOnlyNotice(false)}
      />
    </div>
  );
};

export default SystemSettingsPage;
