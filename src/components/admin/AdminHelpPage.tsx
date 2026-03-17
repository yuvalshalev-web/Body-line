import React from 'react';

/* Body-Line Admin Help Page
  Directive: Ultra-luxury Glassmorphism | Language: Hebrew
*/

const AdminHelpPage = () => {
  return (
    <div className="admin-info-card p-10 rounded-[30px] text-white font-sans">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-black text-[#4a002e] mb-2">🌊 מדריך לוגיקת האנליטיקה</h1>
        <p className="text-[#f063c1]/60 font-bold">כאן תוכלו להבין איך פעולות הניהול שלכם מעצבות את חוויית המשתמש והנתונים באתר.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* כרטיסייה 1: השעיה */}
        <div className="admin-info-card p-8 rounded-3xl transition-transform hover:-translate-y-1">
          <div className="text-4xl mb-4">🚫</div>
          <h3 className="text-xl font-black text-[#ff009f] mb-4">השעיית חבר</h3>
          <p className="text-[#4a002e] mb-4">כאשר חבר מושעה, הוא הופך ל"שקוף" עבור המערכת הסטטיסטית.</p>
          <ul className="list-disc pr-5 text-sm leading-relaxed text-[#4a002e]/80">
            <li><strong>המכנה המשותף ($n$):</strong> קטן ב-1 באופן מיידי.</li>
            <li><strong>ממוצעים:</strong> מתנקים מנתוני החבר המושעה (כדי למנוע "בורות" בגרפים).</li>
            <li><strong>השפעה:</strong> החברים הפעילים רואים תמונה ריאליסטית של הזהות (הקבוצה) המתאמנת כרגע.</li>
          </ul>
        </div>

        {/* כרטיסייה 2: החזרה לפעילות */}
        <div className="admin-info-card p-8 rounded-3xl transition-transform hover:-translate-y-1">
          <div className="text-4xl mb-4">🔄</div>
          <h3 className="text-xl font-black text-[#ff009f] mb-4">החזרה לפעילות</h3>
          <p className="text-[#4a002e] mb-4">החזרת חבר לסטטוס Active מבצעת "כיול מחדש" לכל האתר.</p>
          <ul className="list-disc pr-5 text-sm leading-relaxed text-[#4a002e]/80">
            <li><strong>אחוזונים:</strong> המערכת מחשבת מחדש את המיקום של כולם (גיל, מרחק, Grit).</li>
            <li><strong>דירוג:</strong> חבר עשוי לראות שמיקומו השתנה כי חבר "חזק" יותר חזר לזהות שלו.</li>
          </ul>
        </div>

        {/* כרטיסייה 3: חבר חדש */}
        <div className="admin-info-card p-8 rounded-3xl transition-transform hover:-translate-y-1">
          <div className="text-4xl mb-4">➕</div>
          <h3 className="text-xl font-black text-[#ff009f] mb-4">צירוף חבר חדש</h3>
          <p className="text-[#4a002e] mb-4">חבר חדש נכנס למערכת ללא היסטוריה, כחלק מהזהות העתידית.</p>
          <ul className="list-disc pr-5 text-sm leading-relaxed text-[#4a002e]/80">
            <li><strong>היסטוריה:</strong> הוא לא משפיע על ממוצעי העבר (כדי לא לעוות נתונים ישנים).</li>
            <li><strong>זמן אמת:</strong> הוא נספר מיד בחישובי ה-Real-time והאחוזונים הנוכחיים.</li>
          </ul>
        </div>
      </section>

      <div className="mt-10 p-5 admin-info-card border-r-4 border-[#ff009f] rounded-xl text-center text-[#4a002e] font-bold">
        <strong>💡 טיפ למנהל:</strong> כל שינוי סטטוס שאתם מבצעים נשמר ב-Firestore ומפעיל "שרשרת תגובה" שמעדכנת את ה-Dashboards של כל החברים בתוך פחות משנייה.
      </div>
    </div>
  );
};

export default AdminHelpPage;
