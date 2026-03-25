import React from 'react';

/* Body-Line Admin Help Page
  Directive: Ultra-luxury Glassmorphism | Language: Hebrew
*/

const AdminHelpPage = () => {
  return (
    <div className="admin-info-card p-10 rounded-[30px] text-white font-sans space-y-12">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-black text-[#00426a] mb-2 drop-shadow-sm">🌊 מדריך לוגיקת האנליטיקה והתפעול</h1>
        <p className="text-[#0071a1] font-bold text-lg">כאן תוכלו להבין איך פעולות הניהול והנתונים מעצבים את חוויית המשתמש באתר.</p>
      </header>

      {/* לוגיקת ניהול חברים */}
      <section>
        <h2 className="text-2xl font-black text-[#00426a] mb-6 border-b-2 border-[#00426a]/10 pb-2">👥 לוגיקת ניהול חברים</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* כרטיסייה 1: השעיה */}
          <div className="admin-info-card p-8 rounded-3xl transition-transform hover:-translate-y-1 border border-white/20">
            <div className="text-4xl mb-4">🚫</div>
            <h3 className="text-xl font-black text-[#00426a] mb-4">השעיית חבר</h3>
            <p className="text-[#00426a] mb-4 font-medium">כאשר חבר מושעה, הוא הופך ל"שקוף" עבור המערכת הסטטיסטית.</p>
            <ul className="list-disc pr-5 text-sm leading-relaxed text-[#00426a]/80 font-bold">
              <li><strong>המכנה המשותף ($n$):</strong> קטן ב-1 באופן מיידי.</li>
              <li><strong>ממוצעים:</strong> מתנקים מנתוני החבר המושעה (כדי למנוע "בורות" בגרפים).</li>
              <li><strong>השפעה:</strong> החברים הפעילים רואים תמונה ריאליסטית של הקבוצה המתאמנת כרגע.</li>
            </ul>
          </div>

          {/* כרטיסייה 2: החזרה לפעילות */}
          <div className="admin-info-card p-8 rounded-3xl transition-transform hover:-translate-y-1 border border-white/20">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-black text-[#00426a] mb-4">החזרה לפעילות</h3>
            <p className="text-[#00426a] mb-4 font-medium">החזרת חבר לסטטוס Active מבצעת "כיול מחדש" לכל האתר.</p>
            <ul className="list-disc pr-5 text-sm leading-relaxed text-[#00426a]/80 font-bold">
              <li><strong>אחוזונים:</strong> המערכת מחשבת מחדש את המיקום של כולם (גיל, מרחק, Grit).</li>
              <li><strong>דירוג:</strong> חבר עשוי לראות שמיקומו השתנה כי חבר "חזק" יותר חזר לזהות שלו.</li>
            </ul>
          </div>

          {/* כרטיסייה 3: חבר חדש */}
          <div className="admin-info-card p-8 rounded-3xl transition-transform hover:-translate-y-1 border border-white/20">
            <div className="text-4xl mb-4">➕</div>
            <h3 className="text-xl font-black text-[#00426a] mb-4">צירוף חבר חדש</h3>
            <p className="text-[#00426a] mb-4 font-medium">חבר חדש נכנס למערכת ללא היסטוריה, כחלק מהזהות העתידית.</p>
            <ul className="list-disc pr-5 text-sm leading-relaxed text-[#00426a]/80 font-bold">
              <li><strong>היסטוריה:</strong> הוא לא משפיע על ממוצעי העבר (כדי לא לעוות נתונים ישנים).</li>
              <li><strong>זמן אמת:</strong> הוא נספר מיד בחישובי ה-Real-time והאחוזונים הנוכחיים.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* תהליך ה-Rollover השבועי */}
      <section>
        <h2 className="text-2xl font-black text-[#00426a] mb-6 border-b-2 border-[#00426a]/10 pb-2">⏳ תהליך ה-Rollover השבועי</h2>
        <div className="admin-info-card p-8 rounded-3xl border border-white/20">
          <p className="text-[#00426a] mb-6 font-bold text-lg">בכל יום חמישי בבוקר, המערכת מבצעת "גלגול" (Rollover) שמעביר את הקהילה מהסשן הנוכחי לסשן הבא.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="bg-[#00426a] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black">1</div>
                <div>
                  <h4 className="font-black text-[#00426a]">ארכוב הסשן</h4>
                  <p className="text-sm text-[#00426a]/70 font-bold">הסשן שהסתיים הופך ל"היסטורי" ונשמר במסד הנתונים עם רשימת המשתתפים הסופית.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-[#00426a] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black">2</div>
                <div>
                  <h4 className="font-black text-[#00426a]">שמירת מצב הים</h4>
                  <p className="text-sm text-[#00426a]/70 font-bold">נתוני טמפרטורת המים, גובה הגלים והרוח נדגמים וננעלים עבור הסשן שבוצע.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-[#00426a] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black">3</div>
                <div>
                  <h4 className="font-black text-[#00426a]">הקמת סשן חדש</h4>
                  <p className="text-sm text-[#00426a]/70 font-bold">נוצר אובייקט "סשן קרוב" חדש עם תאריך חמישי הבא וטיימר ספירה לאחור.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-[#00426a] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black">4</div>
                <div>
                  <h4 className="font-black text-[#00426a]">איפוס טיימר</h4>
                  <p className="text-sm text-[#00426a]/70 font-bold">הטיימר המרכזי באתר מתאפס ומתחיל לספור לאחור לסשן החדש.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="bg-[#00426a] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black">5</div>
                <div>
                  <h4 className="font-black text-[#00426a]">איפוס רשימת הגעה</h4>
                  <p className="text-sm text-[#00426a]/70 font-bold">רשימת ה"מאשרים" מתאפסת כדי לאפשר הרשמה חדשה לסשן הבא.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-[#00426a] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black">6</div>
                <div>
                  <h4 className="font-black text-[#00426a]">עדכון מדדי התמדה</h4>
                  <p className="text-sm text-[#00426a]/70 font-bold">המערכת מעדכנת את ה-Streak (רצף) וה-Grit Score של כל משתתף שהגיע.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-[#00426a] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black">7</div>
                <div>
                  <h4 className="font-black text-[#00426a]">חישוב אחוזונים קבוצתי</h4>
                  <p className="text-sm text-[#00426a]/70 font-bold">כל המדדים הקבוצתיים (ממוצע גיל, מרחק, התמדה עונתית) מחושבים מחדש.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-[#00426a] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black">8</div>
                <div>
                  <h4 className="font-black text-[#00426a]">שמירת מסד נתונים</h4>
                  <p className="text-sm text-[#00426a]/70 font-bold">כל העדכונים ננעלים ב-Firestore ומסנכרנים את האתר לכל המשתמשים.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* מדדי התמדה ו-Grit */}
      <section>
        <h2 className="text-2xl font-black text-[#00426a] mb-6 border-b-2 border-[#00426a]/10 pb-2">🔥 מדדי התמדה ודירוג עונתי</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="admin-info-card p-8 rounded-3xl border border-white/20">
            <h3 className="text-xl font-black text-[#00426a] mb-4">Grit Score (מדד החוסן)</h3>
            <p className="text-[#00426a] mb-4 font-bold">הנוסחה: <span className="bg-white/30 px-2 py-1 rounded text-sm">(סך סשנים × 1.5) + (רצף שבועות × 4)</span></p>
            <p className="text-sm text-[#00426a]/80 font-medium leading-relaxed">
              ה-Grit Score אינו רק כמות הגעה, אלא שקלול של התמדה לאורך זמן יחד עם רצף נוכחות נוכחי. 
              הוא מעודד חברים לא רק להגיע, אלא לא לפספס שבועות רצופים. המדד מוגבל ל-100 נקודות.
            </p>
          </div>
          <div className="admin-info-card p-8 rounded-3xl border border-white/20">
            <h3 className="text-xl font-black text-[#00426a] mb-4">קטגוריות עונתיות</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold">
              <div className="bg-blue-50/50 p-2 rounded text-blue-800">❄️ <strong>Penguins:</strong> גולשי חורף (מים מתחת ל-20°C)</div>
              <div className="bg-orange-50/50 p-2 rounded text-orange-800">☀️ <strong>Jellyfish:</strong> גולשי קיץ (מים מעל ל-27°C)</div>
              <div className="bg-slate-50/50 p-2 rounded text-slate-800">🦈 <strong>Sharks:</strong> יציבות גבוהה לאורך כל 4 העונות</div>
              <div className="bg-purple-50/50 p-2 rounded text-purple-800">🐋 <strong>Orcas:</strong> מובילי הדירוג בכל הקטגוריות</div>
            </div>
          </div>
        </div>
      </section>

      {/* מדדי Drift ו-Vintage */}
      <section>
        <h2 className="text-2xl font-black text-[#00426a] mb-6 border-b-2 border-[#00426a]/10 pb-2">🧭 מדדי Drift ו-Vintage (מיקום וגיל)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drift */}
          <div className="admin-info-card p-8 rounded-3xl border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl">📍</div>
              <h3 className="text-xl font-black text-[#00426a]">מדד ה-Drift (מרחק מהבית)</h3>
            </div>
            <p className="text-sm text-[#00426a]/80 font-medium leading-relaxed mb-4">
              מדד זה מחשב את המרחק האווירי (ב-ק"מ) בין כתובת המגורים של החבר לבין ה-"Home Break" (חוף הבית) של הקהילה.
            </p>
            <ul className="list-disc pr-5 text-xs leading-relaxed text-[#00426a]/70 font-bold space-y-2">
              <li><strong>אחוזון קרבה:</strong> המערכת מדרגת את החבר ביחס לשאר הקהילה.</li>
              <li><strong>משמעות:</strong> ככל שהאחוזון גבוה יותר, החבר נחשב ל"מקומי" יותר (קרוב יותר לחוף מ-X% מהחברים).</li>
              <li><strong>הערכה:</strong> המדד נותן כבוד לאלו שנוסעים מרחקים ארוכים כדי להגיע לסשן.</li>
            </ul>
          </div>

          {/* Vintage */}
          <div className="admin-info-card p-8 rounded-3xl border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl">🍷</div>
              <h3 className="text-xl font-black text-[#00426a]">מדד ה-Vintage (אחוזון גיל)</h3>
            </div>
            <p className="text-sm text-[#00426a]/80 font-medium leading-relaxed mb-4">
              מדד ה-"וינטג'" משקף את המיקום היחסי של החבר בהתפלגות הגילאים של הקהילה.
            </p>
            <ul className="list-disc pr-5 text-xs leading-relaxed text-[#00426a]/70 font-bold space-y-2">
              <li><strong>אחוזון גיל:</strong> חישוב סטטיסטי המראה כמה אחוזים מהקהילה צעירים/מבוגרים מהחבר.</li>
              <li><strong>תגים (Badges):</strong> המערכת מעניקה תארים כמו "Experienced Surfer" (לוותיקים) או "Young & Promising" (לצעירים).</li>
              <li><strong>מטרה:</strong> יצירת גאוות יחידה סביב הניסיון והאנרגיה הצעירה בתוך אותה קבוצה.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* פילוסופיית "הגעת - ניצחת" */}
      <section>
        <h2 className="text-2xl font-black text-[#00426a] mb-6 border-b-2 border-[#00426a]/10 pb-2">🏆 אלגוריתם "הגעת – ניצחת. כל השאר בונוס"</h2>
        <div className="admin-info-card p-8 rounded-3xl border border-white/20 bg-gradient-to-br from-[#00426a]/5 to-transparent">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="text-6xl">🥇</div>
            <div>
              <p className="text-[#00426a] mb-4 font-bold text-xl">זוהי ליבת הפילוסופיה של הקהילה והנתונים באתר.</p>
              <p className="text-sm text-[#00426a]/80 font-medium leading-relaxed mb-4">
                בניגוד למערכות תחרותיות רגילות, המערכת שלנו בנויה על העיקרון שהניצחון האמיתי הוא עצם ההגעה לחוף והכניסה למים. 
                האלגוריתם מתעדף את ה"נוכחות" מעל לכל ביצוע טכני או מדד פיזי.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/30 p-4 rounded-xl border border-[#00426a]/10">
                  <h4 className="font-black text-[#00426a] mb-1">הגעת = ניצחת</h4>
                  <p className="text-xs text-[#00426a]/70 font-bold">עצם ההגעה מעניקה את הניקוד הבסיסי והמשמעותי ביותר ב-Grit Score ובדירוג השבועי. זהו המדד הכי "טהור" של חבר בקהילה.</p>
                </div>
                <div className="bg-white/30 p-4 rounded-xl border border-[#00426a]/10">
                  <h4 className="font-black text-[#00426a] mb-1">כל השאר בונוס</h4>
                  <p className="text-xs text-[#00426a]/70 font-bold">רצפים (Streaks), מרחקים, וביצועים עונתיים הם רק שכבות נוספות שנועדו להוסיף עניין וגיוון, אך הם לעולם לא יחליפו את ערך ההתמדה הבסיסי.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* מחשבון התאמת גלשן */}
      <section>
        <h2 className="text-2xl font-black text-[#00426a] mb-6 border-b-2 border-[#00426a]/10 pb-2">🏄‍♂️ לוגיקת מחשבון הגלשנים</h2>
        <div className="admin-info-card p-8 rounded-3xl border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xl font-black text-[#00426a] mb-4">איך המערכת ממליצה?</h3>
              <p className="text-[#00426a]/80 font-bold mb-4">האלגוריתם משקלל 4 פרמטרים קריטיים:</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-[#00426a] font-black">
                  <span className="w-2 h-2 bg-[#00426a] rounded-full"></span> משקל הגוף (הבסיס לנפח הציפה)
                </li>
                <li className="flex items-center gap-3 text-[#00426a] font-black">
                  <span className="w-2 h-2 bg-[#00426a] rounded-full"></span> גובה הגולש (משפיע על אורך הגלשן והמנוף)
                </li>
                <li className="flex items-center gap-3 text-[#00426a] font-black">
                  <span className="w-2 h-2 bg-[#00426a] rounded-full"></span> רמת גלישה (מתלמד עד מתקדם)
                </li>
                <li className="flex items-center gap-3 text-[#00426a] font-black">
                  <span className="w-2 h-2 bg-[#00426a] rounded-full"></span> כושר גופני (יכולת חתירה וסיבולת)
                </li>
              </ul>
            </div>
            <div className="bg-white/20 p-6 rounded-2xl border border-white/30">
              <h4 className="font-black text-[#00426a] mb-2">מדד הציפה (Volume)</h4>
              <p className="text-sm text-[#00426a]/70 font-bold mb-4">המערכת משווה את הגלשן הנוכחי של החבר להמלצה האופטימלית:</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-emerald-700 bg-emerald-50/50 p-2 rounded">
                  <span>טווח של ±2 ליטר</span>
                  <span>התאמה מושלמת</span>
                </div>
                <div className="flex justify-between text-xs font-black text-blue-700 bg-blue-50/50 p-2 rounded">
                  <span>מעל 2 ליטר הפרש</span>
                  <span>גלשן מציף (קל לחתירה)</span>
                </div>
                <div className="flex justify-between text-xs font-black text-amber-700 bg-amber-50/50 p-2 rounded">
                  <span>מתחת ל-2 ליטר הפרש</span>
                  <span>גלשן קטן (מאתגר)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* התאמה אישית לפי מדדי גוף, רמת גלישה ומצב הים */}
      <section>
        <h2 className="text-2xl font-black text-[#00426a] mb-6 border-b-2 border-[#00426a]/10 pb-2">✨ התאמה אישית לפי מדדי גוף, רמת גלישה ומצב הים</h2>
        <div className="admin-info-card p-8 rounded-3xl border border-white/20">
          <p className="text-[#00426a] mb-6 font-bold text-lg">אלגוריתם ההמלצה היומית מבצע אופטימיזציה בזמן אמת בין נתוני הגולש לתנאי הים המשתנים.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/30 p-6 rounded-2xl border border-[#00426a]/10">
              <h4 className="font-black text-[#00426a] mb-3">📏 כיול נפח (Volume)</h4>
              <p className="text-xs text-[#00426a]/80 font-bold leading-relaxed">
                הנפח הבסיסי מחושב לפי משקל ורמה, אך משתנה לפי גובה הגלים:
                <br/><br/>
                • <strong>ים נמוך:</strong> תוספת של 15%-35% לנפח (לציפה מקסימלית).
                <br/>
                • <strong>ים גבוה:</strong> תוספת של 5%-8% (ליציבות וכניסה מוקדמת).
              </p>
            </div>
            <div className="bg-white/30 p-6 rounded-2xl border border-[#00426a]/10">
              <h4 className="font-black text-[#00426a] mb-3">📐 בחירת סוג גלשן</h4>
              <p className="text-xs text-[#00426a]/80 font-bold leading-relaxed">
                המערכת בוחרת את סוג הגלשן האופטימלי:
                <br/><br/>
                • <strong>ים חלש:</strong> Fish או Longboard לייצור מהירות.
                <br/>
                • <strong>ים קלאסי:</strong> Shortboard או Hybrid לביצועים.
                <br/>
                • <strong>ים עוצמתי:</strong> Step-up לשליטה במהירות גבוהה.
              </p>
            </div>
            <div className="bg-white/30 p-6 rounded-2xl border border-[#00426a]/10">
              <h4 className="font-black text-[#00426a] mb-3">🌡️ המלצת ביגוד (Wetsuit)</h4>
              <p className="text-xs text-[#00426a]/80 font-bold leading-relaxed">
                מבוסס על טמפרטורת המים המדויקת:
                <br/><br/>
                • <strong>מתחת ל-20°C:</strong> חליפה ארוכה 4/3.
                <br/>
                • <strong>20°C-24°C:</strong> חליפת מעבר 3/2.
                <br/>
                • <strong>מעל 26°C:</strong> לייקרה או בגד ים.
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <p className="text-xs text-rose-900 font-black">⚠️ <strong>מנגנון בטיחות:</strong> המערכת תציג אזהרה אדומה לגולשים מתחילים כאשר הים עולה מעל 1.5 מטר, ותמליץ להישאר בחוף.</p>
          </div>
        </div>
      </section>

      <div className="mt-10 p-6 admin-info-card border-r-8 border-[#00426a] rounded-2xl text-center text-[#00426a] font-black text-lg shadow-lg">
        <strong>💡 טיפ למנהל:</strong> כל הנתונים שאתם רואים ב-Dashboards נגזרים מהלוגיקה הזו. הבנת התהליכים תעזור לכם להסביר לחברים למה הדירוג שלהם השתנה או איך להשתפר.
      </div>
    </div>
  );
};

export default AdminHelpPage;
