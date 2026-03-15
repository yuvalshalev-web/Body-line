import React from 'react';

/* Body-Line Admin Help Page
  Directive: Ultra-luxury Glassmorphism | Language: Hebrew
*/

const AdminHelpPage = () => {
  return (
    <div className="admin-help-container">
      <header className="help-header">
        <h1>🌊 מדריך לוגיקת האנליטיקה</h1>
        <p>כאן תוכלו להבין איך פעולות הניהול שלכם מעצבות את חוויית המשתמש והנתונים באתר.</p>
      </header>

      <section className="logic-grid">
        {/* כרטיסייה 1: השעיה */}
        <div className="logic-card">
          <div className="icon-wrapper">🚫</div>
          <h3>השעיית חבר</h3>
          <p>כאשר חבר מושעה, הוא הופך ל"שקוף" עבור המערכת הסטטיסטית.</p>
          <ul>
            <li><strong>המכנה הקבוצתי ($n$):</strong> קטן ב-1 באופן מיידי.</li>
            <li><strong>ממוצעים:</strong> מתנקים מנתוני החבר המושעה (כדי למנוע "בורות" בגרפים).</li>
            <li><strong>השפעה:</strong> החברים הפעילים רואים תמונה ריאליסטית של הקבוצה המתאמנת כרגע.</li>
          </ul>
        </div>

        {/* כרטיסייה 2: החזרה לפעילות */}
        <div className="logic-card">
          <div className="icon-wrapper">🔄</div>
          <h3>החזרה לפעילות</h3>
          <p>החזרת חבר לסטטוס Active מבצעת "כיול מחדש" לכל האתר.</p>
          <ul>
            <li><strong>אחוזונים:</strong> המערכת מחשבת מחדש את המיקום של כולם (גיל, מרחק, Grit).</li>
            <li><strong>דירוג:</strong> חבר עשוי לראות שמיקומו השתנה כי חבר "חזק" יותר חזר לקבוצה.</li>
          </ul>
        </div>

        {/* כרטיסייה 3: חבר חדש */}
        <div className="logic-card">
          <div className="icon-wrapper">➕</div>
          <h3>צירוף חבר חדש</h3>
          <p>חבר חדש נכנס למערכת ללא היסטוריה, כחלק מהקבוצה העתידית.</p>
          <ul>
            <li><strong>היסטוריה:</strong> הוא לא משפיע על ממוצעי העבר (כדי לא לעוות נתונים ישנים).</li>
            <li><strong>זמן אמת:</strong> הוא נספר מיד בחישובי ה-Real-time והאחוזונים הנוכחיים.</li>
          </ul>
        </div>
      </section>

      <div className="pro-tip">
        <strong>💡 טיפ למנהל:</strong> כל שינוי סטטוס שאתם מבצעים נשמר ב-Firestore ומפעיל "שרשרת תגובה" שמעדכנת את ה-Dashboards של כל החברים בתוך פחות משנייה.
      </div>

      <style>{`
        .admin-help-container {
          padding: 40px;
          color: #fff;
          font-family: 'Assistant', sans-serif;
          background: rgba(0, 112, 133, 0.1); /* Deep Teal Sea Alpha */
          border-radius: 30px;
        }
        .help-header { margin-bottom: 40px; text-align: center; }
        .logic-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
        }
        .logic-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 30px;
          border-radius: 24px;
          transition: transform 0.3s ease;
        }
        .logic-card:hover { transform: translateY(-5px); }
        .icon-wrapper { font-size: 2.5rem; margin-bottom: 15px; }
        .logic-card h3 { color: #FF2D60; margin-bottom: 15px; }
        .logic-card ul { padding-right: 20px; font-size: 0.9rem; line-height: 1.6; }
        .admin-help-container p,
        .admin-help-container li,
        .pro-tip {
          color: #0071a1;
        }
        .pro-tip {
          margin-top: 40px;
          padding: 20px;
          background: rgba(255, 222, 69, 0.1); /* Sunshine Yellow Alpha */
          border-left: 4px solid #FFDE45;
          border-radius: 10px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default AdminHelpPage;
