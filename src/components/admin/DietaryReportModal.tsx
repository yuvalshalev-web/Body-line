import React, { useState, useMemo } from 'react';
import { 
  Utensils, 
  X, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  Leaf, 
  Wheat, 
  Milk, 
  Search, 
  Download, 
  Info,
  Phone,
  Mail,
  Filter,
  Clock,
  CalendarX,
  Sun
} from 'lucide-react';
import { Member } from '../../types';
import { getAvailabilityLabel, AvailabilitySchedule } from '../../constants/availability';
import * as XLSX from 'xlsx';

interface DietaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
}

export const DietaryReportModal: React.FC<DietaryReportModalProps> = ({
  isOpen,
  onClose,
  members
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to check if a member has a dietary or availability trait
  const checkMemberAttributes = (m: any) => {
    const prefs: string[] = Array.isArray(m.dietaryPreferences) ? m.dietaryPreferences : [];
    
    const isOmnivore = prefs.some(p => p === 'omnivore' || p === 'אוכל הכל (ברירת מחדל)' || p === 'אוכל הכל' || p === 'אוכלי כל') ||
      (!prefs.some(p => p === 'vegetarian' || p === 'צמחוני' || p === 'vegan' || p === 'טבעוני') && !m.is_vegetarian && !m.is_vegan && m.dietary_preference !== 'vegetarian' && m.dietary_preference !== 'vegan');
      
    const isMehadrin = prefs.some(p => p === 'kosher_mehadrin' || p === 'כשר למהדרין (בד״ץ)' || p === 'כשר למהדרין');
    const isKosher = isMehadrin || prefs.some(p => p === 'kosher' || p === 'כשר' || p === 'כשר (רגיל)' || p === 'kosher_dairy_meat' || p === 'כשר חלבי / כשר בשרי') ||
      m.is_kosher || m.dietary_preference === 'kosher';
      
    const isVegetarian = prefs.some(p => p === 'vegetarian' || p === 'צמחוני') ||
      m.is_vegetarian || m.dietary_preference === 'vegetarian';
      
    const isVegan = prefs.some(p => p === 'vegan' || p === 'טבעוני') ||
      m.is_vegan || m.dietary_preference === 'vegan';
      
    const isGlutenFree = prefs.some(p => p === 'gluten_free' || p === 'ללא גלוטן / רגישות לגלוטן' || p === 'ללא גלוטן') ||
      m.is_gluten_free || m.dietary_preference === 'gluten_free';
      
    const isLactoseFree = prefs.some(p => p === 'lactose_free' || p === 'ללא לקטוז / רגישות לחלב' || p === 'ללא לקטוז') ||
      m.is_lactose_free || m.dietary_preference === 'lactose_free';

    const isNutFree = prefs.some(p => p === 'nut_free' || p === 'אלרגיה לאגוזים / בוטנים');
    const isSoyFree = prefs.some(p => p === 'soy_free' || p === 'ללא סויה');
    const isSugarFree = prefs.some(p => p === 'sugar_free' || p === 'ללא סוכר / סוכרתי');
    
    const otherAllergies = [
      m.food_allergies, 
      m.other_allergies,
      isNutFree ? 'אלרגיה לאגוזים/בוטנים' : null,
      isSoyFree ? 'ללא סויה' : null,
      isSugarFree ? 'ללא סוכר' : null
    ].filter(Boolean).join(', ');

    const hasAllergy = Boolean(isNutFree || isSoyFree || isSugarFree || m.food_allergies?.trim() || m.other_allergies?.trim());
    const notes = m.dietaryNotes || m.dietary_notes || '';
    const hasNotes = Boolean(notes.trim());

    // Availability Schedule
    const availability: AvailabilitySchedule = m.availabilitySchedule || 'always';
    const isNoShabbat = availability === 'no_shabbat_holidays';
    const isWeekdaysOnly = availability === 'weekdays_only';
    const isAlwaysAvailable = availability === 'always';
    const availabilityLabel = getAvailabilityLabel(availability);

    const isStandard = isOmnivore && !isKosher && !isGlutenFree && !isLactoseFree && !hasAllergy && !hasNotes;

    const displayName = m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : (m.name || 'ללא שם');

    return {
      displayName,
      isOmnivore,
      isKosher,
      isMehadrin,
      isVegetarian,
      isVegan,
      isGlutenFree,
      isLactoseFree,
      isNutFree,
      isSoyFree,
      isSugarFree,
      hasAllergy,
      allergiesText: otherAllergies,
      notes,
      hasNotes,
      availability,
      isNoShabbat,
      isWeekdaysOnly,
      isAlwaysAvailable,
      availabilityLabel,
      isStandard,
      hasSpecial: !isStandard || !isAlwaysAvailable
    };
  };

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const total = members.length;
    let omnivore = 0;
    let kosher = 0;
    let vegetarian = 0;
    let vegan = 0;
    let glutenFree = 0;
    let lactoseFree = 0;
    let withAllergies = 0;
    let withSpecialNotes = 0;
    let standard = 0;
    
    // Availability stats
    let alwaysAvailable = 0;
    let noShabbat = 0;
    let weekdaysOnly = 0;

    members.forEach(m => {
      const d = checkMemberAttributes(m);
      if (d.isOmnivore) omnivore++;
      if (d.isKosher) kosher++;
      if (d.isVegetarian) vegetarian++;
      if (d.isVegan) vegan++;
      if (d.isGlutenFree) glutenFree++;
      if (d.isLactoseFree) lactoseFree++;
      if (d.hasAllergy) withAllergies++;
      if (d.hasNotes) withSpecialNotes++;
      if (d.isStandard) standard++;

      if (d.isNoShabbat) noShabbat++;
      else if (d.isWeekdaysOnly) weekdaysOnly++;
      else alwaysAvailable++;
    });

    return {
      total,
      omnivore,
      kosher,
      vegetarian,
      vegan,
      glutenFree,
      lactoseFree,
      withAllergies,
      withSpecialNotes,
      standard,
      alwaysAvailable,
      noShabbat,
      weekdaysOnly,
      specialNeedsCount: total - standard
    };
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const d = checkMemberAttributes(m);
      const memberAny = m as any;
      const phoneNum = m.mobile || memberAny.phone || '';
      const searchTarget = `${d.displayName} ${m.email || ''} ${phoneNum} ${d.allergiesText} ${d.notes} ${d.availabilityLabel}`.toLowerCase();
      
      if (searchTerm && !searchTarget.includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (filterType === 'all') return true;
      if (filterType === 'special_only') return d.hasSpecial;
      if (filterType === 'omnivore') return d.isOmnivore;
      if (filterType === 'kosher') return d.isKosher;
      if (filterType === 'vegetarian') return d.isVegetarian;
      if (filterType === 'vegan') return d.isVegan;
      if (filterType === 'gluten') return d.isGlutenFree;
      if (filterType === 'lactose') return d.isLactoseFree;
      if (filterType === 'allergies') return d.hasAllergy;
      if (filterType === 'no_shabbat') return d.isNoShabbat;
      if (filterType === 'weekdays_only') return d.isWeekdaysOnly;
      if (filterType === 'always') return d.isAlwaysAvailable;
      if (filterType === 'standard') return d.isStandard;

      return true;
    });
  }, [members, filterType, searchTerm]);

  // Export full report to Excel
  const handleExportExcel = () => {
    const exportData = members.map((m, index) => {
      const d = checkMemberAttributes(m);
      const memberAny = m as any;
      return {
        'מספר': index + 1,
        'שם מלא': d.displayName,
        'טלפון': m.mobile || memberAny.phone || '',
        'אימייל': m.email || '',
        'תפקיד': m.role === 'Admin' ? 'רכז' : m.role === 'Staff' ? 'צוות עמותה' : m.role === 'Instructor' ? 'מדריך' : m.role === 'Volunteer' ? 'מתנדב' : 'משתתף',
        'זמינות לפעילויות': d.availabilityLabel,
        'סגנון תזונה': d.isVegan ? 'טבעוני' : d.isVegetarian ? 'צמחוני' : 'אוכל הכל',
        'כשרות': d.isMehadrin ? 'כשר למהדרין (בד״ץ)' : d.isKosher ? 'כשר' : 'לא שומר',
        'צמחוני': d.isVegetarian ? 'כן' : 'לא',
        'טבעוני': d.isVegan ? 'כן' : 'לא',
        'ללא גלוטן': d.isGlutenFree ? 'כן' : 'לא',
        'ללא לקטוז': d.isLactoseFree ? 'כן' : 'לא',
        'אלרגיות ורגישויות': d.allergiesText || 'אין',
        'הערות תזונה מיוחדות': d.notes || 'אין'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'דו"ח תזונה זמינות והעדפות');
    
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 15 },
      { wch: 25 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 30 }
    ];

    XLSX.writeFile(workbook, `דו״ח_תזונה_זמינות_והעדפות_חבל_זוג_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={onClose}>
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden text-right font-sans"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-l from-[#092734] via-[#0d3b4f] to-[#092734] text-white flex items-center justify-between border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF9F1C] to-amber-300 text-[#092734] flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Utensils size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                  דו"ח תזונה, זמינות והעדפות
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00AFC2]/20 text-cyan-300 border border-[#00AFC2]/40">
                  {stats.total} חברי קהילה
                </span>
              </div>
              <p className="text-xs sm:text-sm text-cyan-100/70 mt-0.5">
                ריכוז סטטיסטי מלא של זמינות שבתות/חגים, העדפות קולינריות ואלרגיות עבור אירועים, פריסות וסדנאות
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              title="הורד קובץ אקסל מלא של כלל העדפות המזון והזמינות"
            >
              <Download size={14} />
              <span className="hidden sm:inline">יצוא לאקסל</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="סגור"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar bg-slate-50/50">
          
          {/* Section: Availability Overview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-amber-600" />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                זמינות לפעילויות ואירועים
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Always Available */}
              <div 
                onClick={() => setFilterType(filterType === 'always' ? 'all' : 'always')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  filterType === 'always' 
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">זמינים תמיד</p>
                    <p className="text-[11px] text-slate-500">כל ימות השבוע וסופ"ש</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-lg font-black text-slate-900">{stats.alwaysAvailable}</span>
                  <span className="text-[10px] text-slate-400 block font-bold">
                    {stats.total > 0 ? Math.round((stats.alwaysAvailable / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* No Shabbat/Holidays */}
              <div 
                onClick={() => setFilterType(filterType === 'no_shabbat' ? 'all' : 'no_shabbat')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  filterType === 'no_shabbat' 
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center">
                    <CalendarX size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-900">ללא שבתות וחגים</p>
                    <p className="text-[11px] text-slate-500">שומרי שבת ומועדים</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-lg font-black text-amber-700">{stats.noShabbat}</span>
                  <span className="text-[10px] text-amber-600 block font-bold">
                    {stats.total > 0 ? Math.round((stats.noShabbat / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Weekdays Only */}
              <div 
                onClick={() => setFilterType(filterType === 'weekdays_only' ? 'all' : 'weekdays_only')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  filterType === 'weekdays_only' 
                    ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100/80 text-sky-700 flex items-center justify-center">
                    <Sun size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sky-900">ימי חול בלבד</p>
                    <p className="text-[11px] text-slate-500">ימים א' עד ה' בלבד</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-lg font-black text-sky-700">{stats.weekdaysOnly}</span>
                  <span className="text-[10px] text-sky-600 block font-bold">
                    {stats.total > 0 ? Math.round((stats.weekdaysOnly / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Dietary Metric Cards */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Utensils size={16} className="text-emerald-600" />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                העדפות קולינריות ואלרגיות
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
              {/* Omnivore */}
              <div 
                onClick={() => setFilterType(filterType === 'omnivore' ? 'all' : 'omnivore')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  filterType === 'omnivore' 
                    ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-teal-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-teal-600 mb-1">
                  <Utensils size={16} />
                  <span className="text-[10px] font-bold bg-teal-100 px-1.5 py-0.5 rounded-md">
                    {stats.total > 0 ? Math.round((stats.omnivore / stats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-800">{stats.omnivore}</p>
                <p className="text-[11px] font-bold text-slate-600">אוכלי כל</p>
              </div>

              {/* Kosher */}
              <div 
                onClick={() => setFilterType(filterType === 'kosher' ? 'all' : 'kosher')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  filterType === 'kosher' 
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-amber-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-amber-600 mb-1">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold bg-amber-100 px-1.5 py-0.5 rounded-md">
                    {stats.total > 0 ? Math.round((stats.kosher / stats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-800">{stats.kosher}</p>
                <p className="text-[11px] font-bold text-slate-600">שומרי כשרות</p>
              </div>

              {/* Vegetarian */}
              <div 
                onClick={() => setFilterType(filterType === 'vegetarian' ? 'all' : 'vegetarian')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  filterType === 'vegetarian' 
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-600 mb-1">
                  <Leaf size={16} />
                  <span className="text-[10px] font-bold bg-emerald-100 px-1.5 py-0.5 rounded-md">
                    {stats.total > 0 ? Math.round((stats.vegetarian / stats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-800">{stats.vegetarian}</p>
                <p className="text-[11px] font-bold text-slate-600">צמחונים</p>
              </div>

              {/* Vegan */}
              <div 
                onClick={() => setFilterType(filterType === 'vegan' ? 'all' : 'vegan')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  filterType === 'vegan' 
                    ? 'bg-green-50 border-green-500 ring-2 ring-green-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-green-400 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-green-700 mb-1">
                  <Leaf size={16} className="fill-green-600" />
                  <span className="text-[10px] font-bold bg-green-100 px-1.5 py-0.5 rounded-md text-green-800">
                    {stats.total > 0 ? Math.round((stats.vegan / stats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-800">{stats.vegan}</p>
                <p className="text-[11px] font-bold text-slate-600">טבעונים</p>
              </div>

              {/* Gluten Free */}
              <div 
                onClick={() => setFilterType(filterType === 'gluten' ? 'all' : 'gluten')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  filterType === 'gluten' 
                    ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-yellow-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-yellow-600 mb-1">
                  <Wheat size={16} />
                  <span className="text-[10px] font-bold bg-yellow-100 px-1.5 py-0.5 rounded-md">
                    {stats.total > 0 ? Math.round((stats.glutenFree / stats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-800">{stats.glutenFree}</p>
                <p className="text-[11px] font-bold text-slate-600">ללא גלוטן</p>
              </div>

              {/* Lactose Free */}
              <div 
                onClick={() => setFilterType(filterType === 'lactose' ? 'all' : 'lactose')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  filterType === 'lactose' 
                    ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-sky-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-sky-600 mb-1">
                  <Milk size={16} />
                  <span className="text-[10px] font-bold bg-sky-100 px-1.5 py-0.5 rounded-md">
                    {stats.total > 0 ? Math.round((stats.lactoseFree / stats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-800">{stats.lactoseFree}</p>
                <p className="text-[11px] font-bold text-slate-600">ללא לקטוז</p>
              </div>

              {/* Allergies / Sensitive */}
              <div 
                onClick={() => setFilterType(filterType === 'allergies' ? 'all' : 'allergies')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  filterType === 'allergies' 
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 shadow-xs' 
                    : 'bg-white border-slate-200/80 hover:border-rose-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-rose-600 mb-1">
                  <AlertTriangle size={16} />
                  <span className="text-[10px] font-bold bg-rose-100 px-1.5 py-0.5 rounded-md text-rose-700">
                    {stats.total > 0 ? Math.round((stats.withAllergies / stats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xl font-black text-rose-600">{stats.withAllergies}</p>
                <p className="text-[11px] font-bold text-rose-800">אלרגיות</p>
              </div>
            </div>
          </div>

          {/* Quick Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar text-xs font-bold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                  filterType === 'all' 
                    ? 'bg-[#092734] text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                הכל ({stats.total})
              </button>
              <button
                onClick={() => setFilterType('omnivore')}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                  filterType === 'omnivore' 
                    ? 'bg-teal-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                אוכלי כל ({stats.omnivore})
              </button>
              <button
                onClick={() => setFilterType('no_shabbat')}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                  filterType === 'no_shabbat' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ללא שבתות/חגים ({stats.noShabbat})
              </button>
              <button
                onClick={() => setFilterType('weekdays_only')}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                  filterType === 'weekdays_only' 
                    ? 'bg-sky-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ימי חול בלבד ({stats.weekdaysOnly})
              </button>
              <button
                onClick={() => setFilterType('special_only')}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                  filterType === 'special_only' 
                    ? 'bg-[#00AFC2] text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                העדפות מיוחדות ({stats.specialNeedsCount})
              </button>
              <button
                onClick={() => setFilterType('allergies')}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                  filterType === 'allergies' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                אלרגיות ({stats.withAllergies})
              </button>
              <button
                onClick={() => setFilterType('kosher')}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                  filterType === 'kosher' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                כשרות ({stats.kosher})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חיפוש לפי שם, זמינות, אלרגיה..."
                className="w-full pl-8 pr-9 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AFC2] text-slate-800"
              />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Members List Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700">
                רשימת משתתפים ({filteredMembers.length})
              </span>
              {filterType !== 'all' && (
                <button 
                  onClick={() => setFilterType('all')}
                  className="text-xs text-[#00AFC2] hover:underline font-bold cursor-pointer"
                >
                  נקה סינון
                </button>
              )}
            </div>

            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Utensils size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-sm font-bold text-slate-600">לא נמצאו משתתפים התואמים לסינון</p>
                <p className="text-xs text-slate-400 mt-1">נסה לשנות את מונח החיפוש או קטגוריית הסינון</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto custom-scrollbar">
                {filteredMembers.map((m) => {
                  const d = checkMemberAttributes(m);
                  return (
                    <div key={m.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Member Info */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <img 
                          src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} 
                          alt={d.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 text-sm">{d.displayName}</p>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {m.role === 'Admin' ? 'רכז' : m.role === 'Staff' ? 'צוות עמותה' : m.role === 'Instructor' ? 'מדריך' : m.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            {(m.mobile || (m as any).phone) && (
                              <span className="flex items-center gap-1">
                                <Phone size={10} className="text-slate-400" />
                                {m.mobile || (m as any).phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dietary & Availability Badges */}
                      <div className="flex-1 flex flex-wrap items-center gap-1.5 sm:justify-end">
                        
                        {/* Availability Tag */}
                        {d.isNoShabbat && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black flex items-center gap-1">
                            <CalendarX size={12} className="text-amber-700" />
                            לא זמין בשבתות וחגים
                          </span>
                        )}
                        {d.isWeekdaysOnly && (
                          <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 border border-sky-300 text-[11px] font-black flex items-center gap-1">
                            <Sun size={12} className="text-sky-700" />
                            ימי חול בלבד (א'-ה')
                          </span>
                        )}
                        {d.isAlwaysAvailable && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50/70 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <Clock size={11} className="text-emerald-600" />
                            זמין תמיד
                          </span>
                        )}

                        {/* Dietary Tags */}
                        {d.isOmnivore && !d.isVegetarian && !d.isVegan && (
                          <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-medium flex items-center gap-1">
                            <Utensils size={12} className="text-teal-600" />
                            אוכל כל
                          </span>
                        )}
                        {d.isKosher && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
                            <ShieldCheck size={12} className="text-amber-600" />
                            כשר
                          </span>
                        )}
                        {d.isVegetarian && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                            <Leaf size={12} className="text-emerald-600" />
                            צמחוני
                          </span>
                        )}
                        {d.isVegan && (
                          <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-800 border border-green-200 text-[11px] font-bold flex items-center gap-1">
                            <Leaf size={12} className="text-green-600 fill-green-600" />
                            טבעוני
                          </span>
                        )}
                        {d.isGlutenFree && (
                          <span className="px-2 py-0.5 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200 text-[11px] font-bold flex items-center gap-1">
                            <Wheat size={12} className="text-yellow-600" />
                            ללא גלוטן
                          </span>
                        )}
                        {d.isLactoseFree && (
                          <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-bold flex items-center gap-1">
                            <Milk size={12} className="text-sky-600" />
                            ללא לקטוז
                          </span>
                        )}
                        {d.allergiesText && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold flex items-center gap-1">
                            <AlertTriangle size={12} className="text-rose-600" />
                            אלרגיה: {d.allergiesText}
                          </span>
                        )}
                        {d.notes && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-medium flex items-center gap-1" title={d.notes}>
                            <Info size={12} className="text-purple-600" />
                            הערה: {d.notes}
                          </span>
                        )}
                        {d.isStandard && d.isAlwaysAvailable && (
                          <span className="text-xs text-slate-400">
                            ללא הגבלות מיוחדות
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            סה"כ בעלי צרכים / הגבלות מיוחדות: <strong className="text-slate-800">{stats.specialNeedsCount}</strong> מתוך {stats.total}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

