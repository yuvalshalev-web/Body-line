
import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Settings, 
  HelpCircle, 
  AlertCircle, 
  Zap, 
  Cpu, 
  MessageSquare,
  ChevronRight,
  Database
} from 'lucide-react';

const AdminInfoPage: React.FC = () => {
  const sections = [
    {
      title: "ניהול חברים חדשים",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      content: [
        "אישור בקשות הצטרפות: יש לוודא כי המבקש מוכר בקהילת הגולשים של הרצליה.",
        "סיסמאות זמניות: לאחר האישור, המערכת מייצרת סיסמה אוטומטית. יש לשלוח אותה למשתמש דרך כפתור הוואטסאפ הייעודי.",
        "ביטול משתמש: במידה וחבר עוזב או מפר את כללי הקהילה, ניתן להפוך את הסטטוס שלו ל'לא פעיל' במקום למחוק לחלוטין."
      ]
    },
    {
      title: "ניהול תוכן ואירועים",
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
      content: [
        "אירועים: הקפידו להוסיף תמונה איכותית ומיקום מדויק לכל אירוע כדי להעלות את אחוז ההשתתפות.",
        "פוסטים: מנהלים יכולים למחוק פוסטים שאינם עומדים ברוח הקהילה.",
        "סנכרון חדשות: כפתור הסנכרון ב-Admin Panel מושך חדשות גלישה באופן אוטומטי. מומלץ להשתמש בו פעם ביום."
      ]
    },
    {
      title: "מידע טכני למנהלים",
      icon: Cpu,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      content: [
        "AI Analysis: הגלריה משתמשת ב-Gemini 3 Flash לניתוח תמונות. במידה והכיתוב אינו הולם, ניתן לערוך את פרטי התמונה.",
        "אבטחה: כל הסיסמאות במערכת מוצפנות ב-SHA-256 ולא ניתנות לצפייה על ידי מנהלים (ניתן רק לאפס סיסמה).",
        "נכסי אתר: שינוי לוגו או תמונת רקע בדף הנכסים משפיע מיידית על כל המשתמשים."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white text-right animate-in fade-in duration-700" dir="rtl">
      <div className="max-w-5xl mx-auto pb-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest mb-4">
            <ShieldCheck size={12} className="text-rose-400" />
            מידע פנימי למנהלים
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">מדריך למנהל הקהילה</h2>
          <p className="text-slate-500 font-bold text-lg">ריכוז הנחיות, כללים ומידע טכני לניהול נבחרת חבל זוג.</p>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-8">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-12 h-12 ${section.bg} ${section.color} rounded-2xl flex items-center justify-center`}>
                    <section.icon size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{section.title}</h3>
                </div>
                
                <ul className="space-y-4">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 group">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors flex-shrink-0" />
                      <p className="text-slate-600 font-bold leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Support Card */}
        <div className="mt-12 p-10 bg-slate-950 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <HelpCircle size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-right">
              <h4 className="text-2xl font-black mb-2">זקוק לעזרה טכנית?</h4>
              <p className="text-slate-400 font-bold max-w-md">
                בכל מקרה של תקלה במערכת, בעיה במסד הנתונים או צורך בעדכון גרסה, פנה למפתח המערכת.
              </p>
            </div>
            
            <a 
              href="mailto:support@shalev.io" 
              className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            >
              <MessageSquare size={18} />
              צור קשר עם התמיכה
            </a>
          </div>
        </div>

        {/* System Info Stats Footer */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-slate-400">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Database size={14} />
            <span>DB Status: Online</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Zap size={14} />
            <span>AI: Gemini 3 Flash Active</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Settings size={14} />
            <span>Version: 2.0.1 Stable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInfoPage;
