import React from 'react';
import {
  TrendingUp,
  Users,
  Activity,
  Calendar,
  HeartHandshake,
  Waves,
  Compass,
  Sparkles,
  Zap,
  Flame,
  Award,
  HelpCircle,
  UserCheck,
  UserX,
  Sun,
  Snowflake,
  CheckCircle2,
  ArrowRightLeft,
  Scale,
  Anchor,
  Timer,
  ShieldCheck,
  RotateCcw,
  UserPlus,
  UserMinus,
  Navigation
} from 'lucide-react';

/* Body-Line Admin Help Page
   Comprehensive Analytics, Logic & Operational Architecture Guide
   Language: Hebrew
*/

const AdminHelpPage: React.FC = () => {
  return (
    <div className="admin-info-card p-6 md:p-10 rounded-[30px] text-[#121212] font-sans space-y-12">
      {/* Page Header */}
      <header className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center justify-center p-4 bg-sky-500/10 text-sky-600 rounded-3xl mb-2 border border-sky-500/20 shadow-xs">
          <HelpCircle size={36} />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#121212] tracking-tight drop-shadow-xs">
          🌊 איך זה עובד?
        </h1>
        <p className="text-[#121212]/80 font-bold text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
          מדריך הלוגיקה, האלגוריתמים, המדדים הסטטיסטיים ותהליכי האוטומציה שמאחורי כל דשבורד באתר.
        </p>
      </header>

      {/* 1. ארכיטקטורת לשוניות האנליטיקה (Tab Navigation Overview) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-[#121212]/10 pb-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-700 rounded-xl">
            <Navigation size={22} />
          </div>
          <h2 className="text-2xl font-black text-[#121212]">🧭 מבנה דפי האנליטיקה ומוקדי הניטור</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white/80 p-5 rounded-2xl border border-[#121212]/10 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-black text-sm text-sky-800">
              <TrendingUp size={18} />
              <span>דופק הקהילה</span>
            </div>
            <p className="text-xs text-[#121212]/70 font-medium">
              ניטור חי של מצב הקהילה: חברים פעילים, ממוצעי גיל ומרחק, מפת חום שבועית ומדדי Grit מרוכזים.
            </p>
          </div>

          <div className="bg-white/80 p-5 rounded-2xl border border-[#121212]/10 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
              <Activity size={18} />
              <span>התמדה קבוצתית</span>
            </div>
            <p className="text-xs text-[#121212]/70 font-medium">
              מגמות נוכחות ארוכות טווח, השוואת רבעונים, ממוצעים נעים וקצבי התייצבות לאורך ציר הזמן.
            </p>
          </div>

          <div className="bg-white/80 p-5 rounded-2xl border border-[#121212]/10 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-black text-sm text-rose-800">
              <HeartHandshake size={18} />
              <span>התמדה זוגית</span>
            </div>
            <p className="text-xs text-[#121212]/70 font-medium">
              פילוח 100% נוכחות בסשן (זוגות מול יחידים), אפקט ה-Buddy Boost, טבלת סנכרון ו-5 הזוגות המובילים.
            </p>
          </div>

          <div className="bg-white/80 p-5 rounded-2xl border border-[#121212]/10 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-black text-sm text-amber-800">
              <Calendar size={18} />
              <span>התמדה עונתית</span>
            </div>
            <p className="text-xs text-[#121212]/70 font-medium">
              פילוח נוכחות ב-4 עונות השנה וסיווג לארכיטיפים: Penguins (חורף), Jellyfish (קיץ), Sharks ו-Orcas.
            </p>
          </div>

          <div className="bg-white/80 p-5 rounded-2xl border border-[#121212]/10 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-black text-sm text-blue-800">
              <Waves size={18} />
              <span>צוללים לסשנים</span>
            </div>
            <p className="text-xs text-[#121212]/70 font-medium">
              ניתוח עומק ברמת הסשן הבודד: נוכחות שמית, התפלגות קריאות גלישה (Calls), תנאי ים ודו״חות תזונה.
            </p>
          </div>
        </div>
      </section>

      {/* 2. התמדה זוגית וחבלי זוג (Pairs Persistence & Buddy Boost) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-[#121212]/10 pb-3">
          <div className="p-2 bg-rose-500/10 text-rose-700 rounded-xl">
            <HeartHandshake size={22} />
          </div>
          <h2 className="text-2xl font-black text-[#121212]">🤝 התמדה זוגית, מדד 100% נוכחות ו-Buddy Boost</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 100% Presence Breakdown */}
          <div className="admin-info-card p-6 rounded-3xl border border-white/30 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-black text-lg">
              <UserCheck size={22} />
              <h3>פילוח 100% נוכחות בסשן</h3>
            </div>
            <p className="text-sm text-[#121212]/80 font-medium leading-relaxed">
              האלגוריתם מפרק את כלל הנוכחות במים (100% מכלל המשתתפים שגלשו) לשלוש קטגוריות סנכרון:
            </p>
            <ul className="list-disc pr-5 text-xs font-bold text-[#121212]/80 space-y-2 leading-relaxed">
              <li>
                <strong className="text-emerald-700">הגיעו כזוג מתואם (%):</strong> משתתפים ששני בני הזוג שלהם נכחו יחד באותו הסשן.
              </li>
              <li>
                <strong className="text-amber-700">הגיעו לבד ללא השותף (%):</strong> גולשים בעלי חבל זוג שהגיעו למרות שבן/בת הזוג נעדרו.
              </li>
              <li>
                <strong className="text-sky-700">גולשים עצמאיים (%):</strong> משתתפים ומתנדבים שאינם מצוותים לחבל זוג.
              </li>
            </ul>
            <div className="p-3 bg-white/60 rounded-xl text-xs text-slate-700 font-bold border border-slate-200">
              💡 <strong>לוח 100 המשבצות:</strong> כל ריבוע מייצג בדיוק 1% מנפח הנוכחות ומאפשר זיהוי ויזואלי של רמת התיאום הקהילתי.
            </div>
          </div>

          {/* Card 2: Buddy Boost */}
          <div className="admin-info-card p-6 rounded-3xl border border-white/30 space-y-4">
            <div className="flex items-center gap-2 text-rose-800 font-black text-lg">
              <Zap size={22} />
              <h3>אפקט ה-Buddy Boost</h3>
            </div>
            <p className="text-sm text-[#121212]/80 font-medium leading-relaxed">
              מדד מובהקות המודד את תרומת המחויבות הזוגית לעלייה בהתמדה:
            </p>
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs font-bold text-rose-900 leading-relaxed">
              נוסחת החישוב:
              <br />
              <code className="text-[11px] block mt-1 bg-white p-1.5 rounded text-rose-800">
                ((ממוצע נוכחות מצוותים - ממוצע לא מצוותים) ÷ ממוצע לא מצוותים) × 100
              </code>
            </div>
            <p className="text-xs text-[#121212]/80 font-bold leading-relaxed">
              המערכת משווה בין שיעור ההתייצבות של חברי חבלי זוג מול חברים ללא שותף. המדד מוכיח שגולש עם שותף מחויב מגיע באחוזים גבוהים בהרבה.
            </p>
          </div>

          {/* Card 3: Joint Streak & Sync */}
          <div className="admin-info-card p-6 rounded-3xl border border-white/30 space-y-4">
            <div className="flex items-center gap-2 text-indigo-800 font-black text-lg">
              <Award size={22} />
              <h3>סנכרון זוגי ורצף משותף</h3>
            </div>
            <p className="text-sm text-[#121212]/80 font-medium leading-relaxed">
              מעקב צמוד אחר איכות השותפות והסינרגיה במים:
            </p>
            <ul className="list-disc pr-5 text-xs font-bold text-[#121212]/80 space-y-2 leading-relaxed">
              <li>
                <strong>רצף משותף (Joint Streak):</strong> מספר הסשנים הרצופים שבהם שני בני הזוג הגיעו יחד. מתאפס אם אחד נעדר.
              </li>
              <li>
                <strong>שיעור סנכרון (% Sync):</strong> אחוז הסשנים המשותפים מתוך סך הסשנים שבהם לפחות אחד מהם גלש.
              </li>
              <li>
                <strong>5 הזוגות המובילים (Top 5):</strong> הבלטת הזוגות המתמידים ביותר עם מדליות ופרטי התייצבות.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. התמדה עונתית וארכיטיפים (Seasonal Persistence) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-[#121212]/10 pb-3">
          <div className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
            <Calendar size={22} />
          </div>
          <h2 className="text-2xl font-black text-[#121212]">❄️ התמדה עונתית ו-4 ארכיטיפי הגלישה</h2>
        </div>

        <div className="admin-info-card p-8 rounded-3xl border border-white/20 space-y-6">
          <p className="text-sm md:text-base text-[#121212]/90 font-bold leading-relaxed">
            המערכת מקטלגת את כל הסשנים ההיסטוריים לפי 4 עונות השנה (סתיו, חורף, אביב, קיץ) ומודדת כיצד מזג האוויר וטמפרטורת המים משפיעים על הגעת הגולשים:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Penguins */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 p-5 rounded-2xl border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">❄️</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">חורף</span>
              </div>
              <h4 className="font-black text-base text-blue-950">Penguins (פינגווינים)</h4>
              <p className="text-xs text-blue-900/80 font-bold leading-relaxed">
                גולשי חורף קשוחים שמתמידים בטמפרטורות מים נמוכות מ-20°C ובתנאי רוח חורפיים מאתגרים.
              </p>
            </div>

            {/* Jellyfish */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-5 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">☀️</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">קיץ</span>
              </div>
              <h4 className="font-black text-base text-amber-950">Jellyfish (מדוזות)</h4>
              <p className="text-xs text-amber-900/80 font-bold leading-relaxed">
                גולשי קיץ הפורחים בטמפרטורת מים חמימה (מעל 27°C) ובשעות אור ארוכות, אך נוטים להיעדר בחורף.
              </p>
            </div>

            {/* Sharks */}
            <div className="bg-gradient-to-br from-slate-100 to-teal-50/60 p-5 rounded-2xl border border-slate-300/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🦈</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">4 עונות</span>
              </div>
              <h4 className="font-black text-base text-slate-950">Sharks (כרישים)</h4>
              <p className="text-xs text-slate-900/80 font-bold leading-relaxed">
                גולשי יציבות ברזל השומרים על שיעור נוכחות גבוה ואחיד לאורך כל 4 עונות השנה ללא הפוגה.
              </p>
            </div>

            {/* Orcas */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50/60 p-5 rounded-2xl border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🐋</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">טופ 5%</span>
              </div>
              <h4 className="font-black text-base text-purple-950">Orcas (לווייתני על)</h4>
              <p className="text-xs text-purple-900/80 font-bold leading-relaxed">
                מובילי הדירוג הקהילתי בכל הזמנים – שילוב של נוכחות עקבית, Grit Score גבוה והובלת הקבוצה במים.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. לוגיקת ניהול משתמשים (User Lifecycle Management) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-[#121212]/10 pb-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-xl">
            <Users size={22} />
          </div>
          <h2 className="text-2xl font-black text-[#121212]">👥 לוגיקת ניהול משתמשים ושלמות הנתונים</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Suspension */}
          <div className="admin-info-card p-6 rounded-3xl border border-white/20 space-y-3">
            <div className="text-3xl">🚫</div>
            <h3 className="text-lg font-black text-[#121212]">השעיית משתמש (Suspended)</h3>
            <p className="text-xs text-[#121212]/80 font-medium leading-relaxed">
              כאשר משתמש מושעה, הוא הופך ל"שקוף" עבור המערכת הסטטיסטית כדי למנוע הטיות מלאכותיות:
            </p>
            <ul className="list-disc pr-5 text-xs font-bold text-[#121212]/80 space-y-1.5 leading-relaxed">
              <li><strong>המכנה המשותף ($n$):</strong> קטן ב-1 באופן מיידי.</li>
              <li><strong>ממוצעים ואחוזונים:</strong> מתנקים מנתוניו כדי לשמור על תמונת אמת של המתאמנים הפעילים.</li>
              <li><strong>חבל זוג:</strong> בן הזוג שנשאר פעיל מוכר עדיין עם היסטוריית הגעה זוגית מלאה.</li>
            </ul>
          </div>

          {/* Reactivation */}
          <div className="admin-info-card p-6 rounded-3xl border border-white/20 space-y-3">
            <div className="text-3xl">🔄</div>
            <h3 className="text-lg font-black text-[#121212]">החזרה לפעילות (Reactivation)</h3>
            <p className="text-xs text-[#121212]/80 font-medium leading-relaxed">
              החזרת משתמש לסטטוס Active מבצעת כיול מחדש (Recalibration) רוחבי:
            </p>
            <ul className="list-disc pr-5 text-xs font-bold text-[#121212]/80 space-y-1.5 leading-relaxed">
              <li><strong>חישוב אחוזונים:</strong> המערכת מדרגת מחדש את מיקום כולם (גיל, מרחק, Grit).</li>
              <li><strong>עדכון התפלגות:</strong> ממוצעי הקהילה מתעדכנים מיידית בכל המסכים.</li>
            </ul>
          </div>

          {/* New Member */}
          <div className="admin-info-card p-6 rounded-3xl border border-white/20 space-y-3">
            <div className="text-3xl">➕</div>
            <h3 className="text-lg font-black text-[#121212]">צירוף משתמש חדש</h3>
            <p className="text-xs text-[#121212]/80 font-medium leading-relaxed">
              משתמש חדש מצטרף למערכת בצורה מודולרית שאינה משבשת את נתוני העבר:
            </p>
            <ul className="list-disc pr-5 text-xs font-bold text-[#121212]/80 space-y-1.5 leading-relaxed">
              <li><strong>היסטוריה:</strong> אינו מעוות ממוצעי עבר של סשנים שבהם לא היה חבר.</li>
              <li><strong>זמן אמת:</strong> נספר מיד בחישובי הנוכחות והאחוזונים של הסשן הקרוב.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. תהליך ה-Rollover השבועי (Thursday Automation) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-[#121212]/10 pb-3">
          <div className="p-2 bg-blue-500/10 text-blue-700 rounded-xl">
            <Timer size={22} />
          </div>
          <h2 className="text-2xl font-black text-[#121212]">⏳ סייקל ה-Rollover השבועי (חמישי בבוקר)</h2>
        </div>

        <div className="admin-info-card p-8 rounded-3xl border border-white/20 space-y-6">
          <p className="text-sm md:text-base text-[#121212] font-bold">
            בכל יום חמישי בבוקר, מנגנון ה-Rollover מבצע סנכרון רציף המעביר את הקהילה מהסשן הנוכחי לסשן הבא:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3.5">
              <div className="flex gap-3.5 items-start p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="bg-[#121212] text-white w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs">1</div>
                <div>
                  <h4 className="font-black text-sm text-[#121212]">ארכוב הסשן שהסתיים</h4>
                  <p className="text-xs text-[#121212]/70 font-bold">הסשן ננעל, מקבל מזהה היסטורי ונשמר במסד עם רשימת המשתתפים הסופית.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="bg-[#121212] text-white w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs">2</div>
                <div>
                  <h4 className="font-black text-sm text-[#121212]">שמירת מצב הים (Snapshot)</h4>
                  <p className="text-xs text-[#121212]/70 font-bold">טמפרטורת המים, גובה הגלים ומהירות הרוח נדגמים וננעלים לסשן.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="bg-[#121212] text-white w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs">3</div>
                <div>
                  <h4 className="font-black text-sm text-[#121212]">הקמת סשן קרוב חדש</h4>
                  <p className="text-xs text-[#121212]/70 font-bold">נוצר אובייקט סשן חדש עם תאריך חמישי הבא וטיימר ספירה לאחור.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="bg-[#121212] text-white w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs">4</div>
                <div>
                  <h4 className="font-black text-sm text-[#121212]">איפוס טיימר האתר</h4>
                  <p className="text-xs text-[#121212]/70 font-bold">השעון המרכזי באתר מתאפס ומתחיל לספור לאחור לשעת הכניסה למים הבאה.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex gap-3.5 items-start p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="bg-[#121212] text-white w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs">5</div>
                <div>
                  <h4 className="font-black text-sm text-[#121212]">איפוס רשימת הגעה (RSVP)</h4>
                  <p className="text-xs text-[#121212]/70 font-bold">רשימת ה"מאשרים" מתאפסת כדי לפתוח חלון הרשמה לסשן החדש.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="bg-[#121212] text-white w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs">6</div>
                <div>
                  <h4 className="font-black text-sm text-[#121212]">עדכון מדדי התמדה ורצפים</h4>
                  <p className="text-xs text-[#121212]/70 font-bold">חישוב מחדש של ה-Streak האישי והזוגי, וה-Grit Score עבור מי שהגיע.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="bg-[#121212] text-white w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs">7</div>
                <div>
                  <h4 className="font-black text-sm text-[#121212]">כיול אחוזונים קבוצתי</h4>
                  <p className="text-xs text-[#121212]/70 font-bold">כל ממוצעי הגיל, המרחק, ההתמדה העונתית וה-Buddy Boost מחושבים מחדש.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="bg-[#121212] text-white w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs">8</div>
                <div>
                  <h4 className="font-black text-sm text-[#121212]">סנכרון ומנעילה ב-Firestore</h4>
                  <p className="text-xs text-[#121212]/70 font-bold">כל הנתונים מסונכרנים בזמן אמת לכלל המכשירים והדפדפנים של המשתמשים.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. מדדי Grit, Drift ו-Vintage */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-[#121212]/10 pb-3">
          <div className="p-2 bg-purple-500/10 text-purple-700 rounded-xl">
            <Flame size={22} />
          </div>
          <h2 className="text-2xl font-black text-[#121212]">🔥 מדדי Grit Score, Drift ו-Vintage</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Grit Score */}
          <div className="admin-info-card p-6 rounded-3xl border border-white/20 space-y-3">
            <div className="flex items-center gap-2 font-black text-lg text-amber-800">
              <Flame size={22} />
              <h3>Grit Score (חוסן והתמדה)</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
              הנוסחה:
              <br />
              <code className="text-[11px] block mt-1 bg-white p-1 rounded text-amber-800">
                (סך סשנים × 1.5) + (רצף שבועות × 4)
              </code>
            </div>
            <p className="text-xs text-[#121212]/80 font-bold leading-relaxed">
              משקלל נפח הגעה מצטבר יחד עם רצף שבועות פעיל (Streak). מעניק יתרון משמעותי לעקביות רצופה (עד תקרה של 100 נקודות).
            </p>
          </div>

          {/* Drift */}
          <div className="admin-info-card p-6 rounded-3xl border border-white/20 space-y-3">
            <div className="flex items-center gap-2 font-black text-lg text-sky-800">
              <Compass size={22} />
              <h3>Drift (מרחק מהחוף)</h3>
            </div>
            <p className="text-xs text-[#121212]/80 font-bold leading-relaxed">
              מחשב מרחק אווירי מדויק (בק״מ) בין כתובת המגורים לבין חוף הבית (Home Break).
            </p>
            <ul className="list-disc pr-5 text-xs font-bold text-[#121212]/70 space-y-1">
              <li><strong>אחוזון מקומי:</strong> מדרג כמה חברים גרים קרוב/רחוק יותר מהגולש.</li>
              <li><strong>הוקרת מאמץ:</strong> מתן קרדיט והערכה לגולשים שנוסעים מרחקים ארוכים.</li>
            </ul>
          </div>

          {/* Vintage */}
          <div className="admin-info-card p-6 rounded-3xl border border-white/20 space-y-3">
            <div className="flex items-center gap-2 font-black text-lg text-purple-800">
              <Award size={22} />
              <h3>Vintage (אחוזון גיל)</h3>
            </div>
            <p className="text-xs text-[#121212]/80 font-bold leading-relaxed">
              משקף את המיקום היחסי של הגולש בהתפלגות הגילאים של כלל חברי הקהילה.
            </p>
            <ul className="list-disc pr-5 text-xs font-bold text-[#121212]/70 space-y-1">
              <li><strong>תגי ניסיון:</strong> תארים כמו "Experienced Master" לוותיקים או "Young & Hungry" לצעירים.</li>
              <li><strong>גיוון בין-דורי:</strong> חיזוק החיבור בין דורות שונים באותו סשן.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. לוגיקת מחשבון גלשנים והתאמת ציוד */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-[#121212]/10 pb-3">
          <div className="p-2 bg-teal-500/10 text-teal-700 rounded-xl">
            <Scale size={22} />
          </div>
          <h2 className="text-2xl font-black text-[#121212]">🏄‍♂️ לוגיקת מחשבון הגלשנים והתאמת ציוד יומית</h2>
        </div>

        <div className="admin-info-card p-8 rounded-3xl border border-white/20 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/40 p-5 rounded-2xl border border-[#121212]/10 space-y-3">
              <h4 className="font-black text-sm text-[#121212] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                כיול נפח (Volume) לפי ים
              </h4>
              <p className="text-xs text-[#121212]/80 font-bold leading-relaxed">
                נפח הבסיס נגזר ממשקל ורמה, אך עובר אופטימיזציה לפי מצב הים:
                <br /><br />
                • <strong>ים נמוך/חלש:</strong> תוספת של 15%-35% לנפח (לחתירה קלה וציפה).
                <br />
                • <strong>ים גבוה/חזק:</strong> התכנסות לטווח מדויק לשליטה במדרון הגל.
              </p>
            </div>

            <div className="bg-white/40 p-5 rounded-2xl border border-[#121212]/10 space-y-3">
              <h4 className="font-black text-sm text-[#121212] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                בחירת סוג גלשן
              </h4>
              <p className="text-xs text-[#121212]/80 font-bold leading-relaxed">
                התאמת שייפ לפי התנאים:
                <br /><br />
                • <strong>ים נמוך:</strong> Longboard או Fish לייצור מהירות.
                <br />
                • <strong>ים קלאסי:</strong> Shortboard או Hybrid לביצועים.
                <br />
                • <strong>ים עוצמתי:</strong> Step-up או גאן ליציבות במהירות.
              </p>
            </div>

            <div className="bg-white/40 p-5 rounded-2xl border border-[#121212]/10 space-y-3">
              <h4 className="font-black text-sm text-[#121212] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                המלצת ביגוד (Wetsuit)
              </h4>
              <p className="text-xs text-[#121212]/80 font-bold leading-relaxed">
                מבוסס על טמפרטורת המים בזמן אמת:
                <br /><br />
                • <strong>מתחת ל-20°C:</strong> חליפה ארוכה 4/3.
                <br />
                • <strong>20°C עד 24°C:</strong> חליפת מעבר 3/2 או שורטי.
                <br />
                • <strong>מעל 26°C:</strong> לייקרה ובגד ים.
              </p>
            </div>
          </div>

          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-xs text-rose-950 font-black leading-relaxed">
              <strong>מנגנון בטיחות לרכזים ומדריכים:</strong> כאשר תנאי הים עולים מעל 1.5 מטר, המערכת מסמנת התראת בטיחות אוטומטית לגולשים ברמות Beginner / Intermediate וממליצה על הדרכה צמודה או הישארות בחוף.
            </p>
          </div>
        </div>
      </section>

      {/* 8. פילוסופיית "הגעת - ניצחת" */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-[#121212]/10 pb-3">
          <div className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
            <Award size={22} />
          </div>
          <h2 className="text-2xl font-black text-[#121212]">🏆 אלגוריתם "הגעת – ניצחת. כל השאר בונוס"</h2>
        </div>

        <div className="admin-info-card p-8 rounded-3xl border border-white/20 bg-gradient-to-br from-amber-500/5 via-slate-500/5 to-transparent">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="text-6xl drop-shadow-sm">🥇</div>
            <div className="space-y-4">
              <h3 className="text-xl font-black text-[#121212]">ליבת הפילוסופיה של הקהילה</h3>
              <p className="text-sm text-[#121212]/80 font-medium leading-relaxed">
                בניגוד למערכות תחרותיות המודדות ביצועים טכניים בלבד, המערכת שלנו מעמידה במרכז את ערך הנוכחות. הניצחון האמיתי הוא לקום בבוקר, להתגבר על מזג האוויר, להגיע לחוף ולהיכנס למים עם הקבוצה.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/60 p-4 rounded-2xl border border-[#121212]/10 space-y-1">
                  <h4 className="font-black text-sm text-[#121212]">הגעת = ניצחת</h4>
                  <p className="text-xs text-[#121212]/70 font-bold leading-relaxed">
                    עצם הנוכחות מעניקה את הניקוד הבסיסי והגבוה ביותר בדירוג וב-Grit Score. זהו המדד השוויוני והמשמעותי ביותר.
                  </p>
                </div>
                <div className="bg-white/60 p-4 rounded-2xl border border-[#121212]/10 space-y-1">
                  <h4 className="font-black text-sm text-[#121212]">כל השאר בונוס</h4>
                  <p className="text-xs text-[#121212]/70 font-bold leading-relaxed">
                    רצפים (Streaks), ארכיטיפים עונתיים וסנכרון זוגי הם שכבות של הנאה והעצמה קהילתית, אך אינם מחליפים את ערך ההתמדה.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Tip */}
      <div className="p-6 admin-info-card border-r-8 border-sky-600 rounded-3xl text-center text-[#121212] font-black text-base shadow-md bg-white/70">
        💡 <strong>טיפ לרכזים ומדריכים:</strong> כל הנתונים, המגמות וההתפלגויות המוצגים בלשוניות "דופק הקהילה", "התמדה קבוצתית", "התמדה זוגית" ו"התמדה עונתית" נשענים על אלגוריתמים אלו. היעזרו במדריך זה להסברת הנתונים לחברים.
      </div>
    </div>
  );
};

export default AdminHelpPage;
