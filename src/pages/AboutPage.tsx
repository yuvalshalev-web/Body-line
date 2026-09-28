import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Info, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Waves, 
  Compass, 
  Award, 
  Search, 
  ChevronDown, 
  CheckCircle2, 
  HelpCircle, 
  Lock, 
  Cpu, 
  ExternalLink, 
  Headset, 
  HeartHandshake, 
  Eye, 
  Database,
  ArrowRight,
  Flame,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { useAuth } from '../contexts/AuthContext';
import { AVAILABLE_COMMUNITIES } from '../constants';

type TabType = 'guide' | 'social' | 'stats' | 'communities' | 'tech' | 'security' | 'vision';

interface GuideItem {
  id: string;
  category: 'core' | 'sessions' | 'duo' | 'passport' | 'community' | 'gear' | 'stats' | 'events' | 'gallery';
  categoryLabel: string;
  title: string;
  summary: string;
  steps: string[];
  tips?: string;
  badge?: string;
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: 'terminology-hierarchy',
    category: 'core',
    categoryLabel: 'מבנה וטרמינולוגיה',
    title: 'מילון המונחים וההיררכיה: קהילת חבל זוג, קבוצה, סבב (א\'/ב\') וחבל זוג',
    summary: 'הבנת 4 דרגי הפעילות של עמותת חבל זוג: מקהילת העמותה הכוללת ועד לצמד האישי במים.',
    steps: [
      '1. קהילת חבל זוג (Macro): קהילת העמותה הכוללת – כלל הגולשים, המתנדבים, הרכזים והקבוצות הפועלים תחת העמותה בכל הארץ.',
      '2. קבוצה (Meso): קבוצת גלישה ספציפית הפועלת במועדון או מיקום גיאוגרפי מוגדר (למשל: קבוצת הרצליה, קבוצת הרצליה - בוגרים, קבוצת אשדוד, קבוצת תל ברוך).',
      '3. סבב (Micro - סבב א\' / סבב ב\'): החלוקה הפנימית של הקבוצה שפועלת במחזוריות של אחת לשבועיים לסירוגין. שבוע אחד סבב א\' במים, שבוע שני סבב ב\'. כאשר מתבצע איחוד לפעילות משותפת – המצב מוגדר כ-"איחוד קבוצתי" או "סבב מאוחד".',
      '4. חבל זוג (Atomic): החיבור הבינאישי המחייב בין מתנדב למשתתף בתוך הסבב (צמד Buddy) התומכים זה בזה במים ומחוצה להם.'
    ],
    tips: 'הפרדה זו מונעת בלבול: אתה חבר בקהילת חבל זוג, משויך לקבוצת הרצליה, גולש בסבב א׳ ומתואם עם חבל הזוג שלך!',
    badge: 'הגדרות יסוד'
  },
  {
    id: 'login-community',
    category: 'core',
    categoryLabel: 'כניסה והרשאות',
    title: 'איך מתחברים ובוחרים קבוצת כניסה בקהילת חבל זוג?',
    summary: 'הזדהות מהירה באמצעות אימייל, סיסמה או טביעת אצבע ביומטרית עם שיוך מאובטח לקבוצה.',
    steps: [
      'הזן את כתובת הדוא״ל והסיסמה שלך (או לחץ על לחצן הזיהוי הביומטרי).',
      'בחר בדרופדאון את הקבוצה שאליה אתה מעוניין להתחבר בסשן הנוכחי (למשל: קבוצת הרצליה, קבוצת תל ברוך).',
      'המערכת מוודאת שאתה משויך לקבוצה שנבחרה בקהילת חבל זוג. אם יש אישור – האפליקציה תיפתח מיידית בהקשר המבודד של הקבוצה.',
      'שים לב: במידה ואינך משויך לקבוצה שנבחרה, הכניסה תיחסם כדי למנוע זליגת מידע ופרטיות.'
    ],
    tips: 'אם אתה שייך למספר קבוצות (למשל הרצליה ובוגרים), תוכל לעבור ביניהן בקלות על ידי התנתקות ובחירה מחדש של הקבוצה בדף הכניסה.'
  },
  {
    id: 'whos-coming',
    category: 'sessions',
    categoryLabel: 'סשנים ונוכחות',
    title: 'פיצ\'ר "מי בא?" (Who\'s Coming) וסינון משתתפים',
    summary: 'מעקב חי אחר החברים שנרשמו לסשן הקרוב, כולל פילוח זוגות, יחידים וצוות הובלה.',
    steps: [
      'בדף הבית מוצג מונה נוכחות דינמי ("X חברים מגיעים לסשן הקרוב").',
      'לחיצה על רשימת המשתתפים פותחת את לוח "מי בא?" עם תמונות ושמות החברים המאשרים.',
      'סרגל סינון חכם מאפשר לצפות ב: חבלי זוג (זוגות שמגיעים יחד), יחידים (מחפשים שותף במים), רכזים ומדריכים.',
      'לחיצה על כל משתתף ברשימה פותחת מיידית את כרטיס הפרופיל והפרטים שלו.'
    ],
    tips: 'אם אתה מגיע כסולו, סמן זאת ובדוק מי עוד מהיחידים מגיע כדי לחבור אליו בחוף!',
    badge: 'חברתי ואינטראקטיבי'
  },
  {
    id: 'session-rsvp',
    category: 'sessions',
    categoryLabel: 'סשנים ונוכחות',
    title: 'אישור הגעה לסשן הקרוב – איך זה עובד?',
    summary: 'עדכון נוכחות בזמן אמת בדף הבית כדי להבטיח היערכות של הרכז והמדריכים בחוף.',
    steps: [
      'בדף הבית מוצג כרטיס הסשן הקרוב עם תאריך ושעה מדויקים.',
      'לחיצה על כפתור "מגיע/ה לסשן" מעדכנת את נוכחותך בזמן אמת במסד הנתונים של הקהילה שלך.',
      'מערכת חבלי הזוג תבדוק מיידית האם בן/בת הזוג שלך מגיעים ותציג חיווי משותף.',
      'לחיצה חוזרת תבטל את אישור ההגעה במידה ומשהו השתנה.'
    ],
    tips: 'זכור את המוטו הקהילתי: "הגעת – ניצחת. כל השאר בונוס!" גם אם הים קשה או שאתה עייף, הנוכחות במפגש היא הערך המוביל.',
    badge: 'חובה לכל מפגש'
  },
  {
    id: 'duo-partner',
    category: 'duo',
    categoryLabel: 'חבל זוג',
    title: 'חבל זוג (Duo Partner) ואפקט Buddy Boost',
    summary: 'מחויבות זוגית הדדית – איך המערכת מעודדת גולשים להתמיד יחד במים ובחוף.',
    steps: [
      'לכל חבר/ה מוגדר בן/בת זוג קבוע ("חבל זוג") לפעילות בים.',
      'כאשר שניכם מאשרים הגעה לסשן, כרטיס הסשן שלכם זוהר ומקבל בונוס התמדה (Buddy Boost).',
      'אם בן הזוג טרם אישר הגעה, מוצג תגית ייעודית וניתן לשלוח לו תזכורת ישירה בוואטסאפ או בטלפון מכרטיס השחקן.',
      'לחיצה על תגית חבל הזוג פותחת את כרטיס השחקן של בן הזוג ישירות.'
    ],
    tips: 'הגעה משותפת של חבל זוג מזניקה את מדד ההתמדה (Grit Score) לשני החברים!',
    badge: 'ערך מפתח'
  },
  {
    id: 'community-directory-networking',
    category: 'community',
    categoryLabel: 'ספר הקהילה',
    title: 'דף הקהילה וכרטיסי שחקן – קישור ויצירת קשר בין חברים',
    summary: 'מרכז החיים החברתיים של הסניף: ספר כתובות דיגיטלי, כרטיסי שחקן אישיים ויצירת קשר בלחיצה.',
    steps: [
      'דף הקהילה מרכז את כל חברי הסניף הפעיל בפורמט גריד כרטיסים יוקרתי או רשימה קומפקטית.',
      'חיפוש מיידי לפי שם פרטי, משפחה, כינוי או טלפון.',
      'סינון מהיר לפי תפקידים: רכזים, מדריכים מוסמכים, מתנדבים ומשתתפי נבחרת.',
      'לחיצה על כרטיס חבר פותחת כרטיס שחקן עשיר עם קישורים ישירים ל-WhatsApp, שיחת טלפון, דוא"ל, תגיות הסמכה ושיוך חבל זוג.'
    ],
    tips: 'בכרטיס השחקן של חבר ניתן לראות מי בן/בת הזוג שלו לחבל וללחוץ עליו כדי לדלג ישירות לכרטיס שלו!'
  },
  {
    id: 'personal-vs-community-stats',
    category: 'stats',
    categoryLabel: 'אנליטיקה וסטטיסטיקות',
    title: 'סטטיסטיקות אישיות לעומת סטטיסטיקות קהילתיות',
    summary: 'כיצד המערכת מחשבת מדדי התמדה אישיים מול אחוזונים וממוצעים קהילתיים מבודדים.',
    steps: [
      'סטטיסטיקה אישית (Personal Lifetime): סך כל הסשנים שלך, מדד ה-Grit Score המצטבר והדרגות בדרכון נשמרים ברמת הפרופיל ומלווים אותך בכל הקהילות.',
      'סטטיסטיקה קהילתית (Community Stats): אחוזוני גיל, אחוזוני מרחק הגעה מהחוף, ממוצעי נפח גלשן וגרף "דופק הקהילה" מחושבים אך ורק ביחס לחברי הסניף הספציפי שאתה מחובר אליו כעת.',
      'בידוד מוחלט: נתוני קהילת "הרצליה - בוגרים" אינם מתערבבים בנתוני "הרצליה" הרגילה או "תל ברוך".'
    ],
    tips: 'אם תעבור בין קהילות, ה-Grit Score האישי שלך יישמר במלואו, אך המיקום היחסי שלך באחוזוני הקהילה יותאם לחברי הסניף החדש!'
  },
  {
    id: 'events-system',
    category: 'events',
    categoryLabel: 'אירועים ומפגשים',
    title: 'אירועים בקהילה – מי יוצר, איפה מופיעות תזכורות וסטטיסטיקת משתתפים',
    summary: 'ניהול אירועי קהילה, סדנאות ומפגשים חברתיים – פילוח קהל יעד, אישורי הגעה והתרעות.',
    steps: [
      'מי יכול ליצור אירוע? כל חבר קהילה רשאי ליצור אירוע חדש דרך דף האירועים, ולקבוע את קהל היעד (אירוע קהילתי פתוח, אירוע למשתתפים בלבד, או אירוע למתנדבים).',
      'מי מנהל ועורך? יוצר האירוע ורכזי הקהילה/צוות עמותה מוסמכים לערוך, לעדכן זמנים ומיקום, או למחוק ולארכב את האירוע.',
      'איפה מופיעות תזכורות? אירועים קרובים מוצגים בסרגל החדשות הרץ (Surf News Ticker) בראש האפליקציה, במונה האירועים הפעילים בדף הבית, ובלוח האירועים המסודר לפי תאריך.',
      'סטטיסטיקה ואישורי הגעה: כל חבר יכול לסמן RSVP ("מגיע/ה"), רשימת המשתתפים מתעדכנת בזמן אמת עם מונה משתתפים, ובלחיצה ניתן לראות את שמות ותמונות כל החברים המגיעים.'
    ],
    tips: 'אירועים שעבר זמנם מועברים אוטומטית לחלק "אירועי עבר" כדי לשמור על לוח נקי ומסודר.',
    badge: 'קהילתי'
  },
  {
    id: 'posts-news-system',
    category: 'community',
    categoryLabel: 'פוסטים וחדשות',
    title: 'לוח פוסטים ועדכוני קהילה – מי מפרסם ואיפה זה מופיע?',
    summary: 'מרחב ההודעות והעדכונים הרשמיים של הקהילה – הודעות רכזים, סיכומי פעילות וסרגל חדשות רץ.',
    steps: [
      'מי יכול ליצור פוסט? פרסום פוסטים רשמיים מתבצע על ידי רכזי הקהילה וצוות העמותה דרך מרכז הרכזים (Admin Hub).',
      'איפה זה מופיע? הפוסטים מוצגים בלוח הפוסטים המלא (/posts), וידג\'ט "פוסט נבחר מהקהילה" מתחלף בדף הבית, ומבזקי חדשות רצים בסרגל העליון (Surf News Tracker).',
      'עושר התוכן: כל פוסט כולל תמונת כותב, תאריך פרסום, תמונה מרכזית וטקסט מעוצב.'
    ],
    tips: 'מומלץ לעקוב אחר לוח הפוסטים לעדכונים שוטפים על פעילויות מיוחדות וסיכומי סופ"ש.'
  },
  {
    id: 'gallery-ai-photos',
    category: 'gallery',
    categoryLabel: 'גלריה ו-AI',
    title: 'גלריה קהילתית והעלאת תמונות – בינה מלאכותית והרשאות מחיקה',
    summary: 'שיתוף רגעי שיא מהמים, אופטימיזציה אוטומטית, ניתוח חכם באמצעות Gemini 3 AI ומדיניות שמירה.',
    steps: [
      'מי יכול להעלות תמונות? כל חבר קהילה מחובר (משתתף, מתנדב, מדריך, רכז) רשאי להעלות תמונות לגלריה (תמיכה בריבוי תמונות בפורמטי JPG, PNG, WEBP, HEIC).',
      'דחיסה ואופטימיזציה: המערכת מכווצת ומתאימה את התמונה ישירות במכשיר (Client-Side) לטעינה מהירה וחסכונית.',
      'ניתוח AI פואטי: מנוע Google Gemini AI סורק את התמונה, מזהה גלשנים, גובה גלים ומאפייני ים ומייצר כותרת פואטית מעוררת השראה בעברית.',
      'הרשאות מחיקה: כל גולש רשאי למחוק את התמונות שהוא עצמו העלה. רכזים, צוות עמותה ואפ-שייפר מורשים למחוק כל תמונה לצורכי שמירה על הכללים והסדר.'
    ],
    tips: 'תמונות מהגלריה נבחרות באופן אקראי לרקעי ה-Header בראש הדפים השונים באפליקציה!',
    badge: 'מופעל ע"י Gemini AI'
  },
  {
    id: 'sea-forecast',
    category: 'gear',
    categoryLabel: 'תנאי ים וציוד',
    title: 'תחזית גלים, ביגוד מומלץ ונפח גלשן',
    summary: 'ניתוח מטאורולוגי חי מול תחנות חיזוי ימיות והתאמה אישית של ציוד הגלישה.',
    steps: [
      'בראש דף הבית מופיע סרגל מצב הים: גובה גלים (במטרים), טמפרטורת מים, ומהירות וכיוון רוח.',
      'מחשבון הביגוד האוטומטי מתריע האם נדרשת חליפת גלישה 3/2, לייקרה קצרה או וסט חום.',
      'מחשבון נפח הגלשן (Volume Calculator) מחשב את הנפח האידיאלי בליטרים לפי משקל הגוף ורמת המיומנות במים.'
    ],
    tips: 'בלחיצה על מצב הים ניתן לפתוח את ניתוח ה-AI המעמיק לתנאי הגלישה היומיים.'
  },
  {
    id: 'grit-passport',
    category: 'passport',
    categoryLabel: 'דרכון והישגים',
    title: 'דרכון הגולש ומדד ההתמדה (Grit Score)',
    summary: 'תיעוד רשמי של שעות ים, רצפי הגעה שבועיים, הסמכות ודרגות מים.',
    steps: [
      'בלשונית "דרכון אקסטרים" תוכל לצפות ברצף השבועי שלך ובמדד ה-Grit המצטבר.',
      'הדרכון מרכז את ההסמכות המקצועיות שלך (וינגייט, ISA, עזרה ראשונה, צניחה חופשית וכו\').',
      'הדרגות במים נעות מחותר מתחיל ועד פופ-אפיסט וקלי סלייטר – כל סשן מקדם אותך ביעד הבא.'
    ],
    tips: 'הנתונים בדרכון האישי מצטברים מכלל הקהילות שבהן אתה חבר ומלווים אותך לאורך כל מסע הגלישה.'
  },
  {
    id: 'community-privacy',
    category: 'community',
    categoryLabel: 'קהילה ופרטיות',
    title: 'למה אני רואה בספר הכתובות רק את חברי הסניף שלי?',
    summary: 'מדיניות פרטיות ומידור נתונים מחמירה המבטיחה שחברי קהילות אחרות לא ייחשפו למידע שלך.',
    steps: [
      'המערכת פועלת בארכיטקטורת Multi-Tenant מבודדת.',
      'דף הקהילה וספר הכתובות מסננים בזמן אמת ומציגים אך ורק את החברים ששייכים לסניף הנוכחי שלך.',
      'רק צוות העמותה המרכזית ומנהל המערכת (App-Shaper) מורשים לפקח על כלל הסניפים.'
    ],
    tips: 'חברי קהילה אינם יכולים לערוך בעצמם את שיוך הקהילות בפרופיל האישי מטעמי אבטחת מידע – רק רכז מוסמך לכך.'
  }
];

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const headerImage = useRandomHeader();
  const { currentCommunityId } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('guide');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>('login-community');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const currentCommunity = useMemo(() => {
    return AVAILABLE_COMMUNITIES.find(c => c.id === currentCommunityId) || AVAILABLE_COMMUNITIES[0];
  }, [currentCommunityId]);

  const filteredGuides = useMemo(() => {
    return GUIDE_ITEMS.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.steps.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen pb-32 text-slate-800" dir="rtl">
      {/* 1. Commercial Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#091519] via-[#0c1f26] to-[#0f172a] text-white pt-10 pb-16 px-4 md:px-8 border-b border-white/10 shadow-2xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
          <img src={headerImage} alt="Header texture" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-xs font-black tracking-wide">
              <Sparkles size={14} className="animate-spin text-cyan-400" />
              <span>פלטפורמת קהילות הגלישה והספורט הימי • מהדורת Enterprise v2.8</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-bold border border-white/10">
              <MapPin size={13} className="text-cyan-400" />
              <span>קהילה פעילה: <strong className="text-white font-black">{currentCommunity.name}</strong></span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              האנשים, הרוח והטכנולוגיה <br />
              <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-300 bg-clip-text text-transparent">
                מאחורי הגלים
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-300 font-bold max-w-3xl leading-relaxed">
              מערכת אקולוגית חכמה לניהול קהילות ימיות אוטונומיות. כאן מתחברים ערכי החברות, הביטחון במים וטכנולוגיית ענן מתקדמת – הכל תחת המוטו:
            </p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between gap-4 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-400/30">
                <Flame size={20} className="text-cyan-400" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-cyan-400 tracking-widest block">מוטו הליבה של הקהילה</span>
                <span className="text-lg md:text-xl font-black text-white tracking-wide">"הגעת – ניצחת. כל השאר בונוס"</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 font-bold block">סניפים פעילים</span>
              <span className="text-xl font-black text-cyan-300">{AVAILABLE_COMMUNITIES.length} קהילות</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 font-bold block">מודל פרטיות</span>
              <span className="text-xl font-black text-emerald-300">מידור הרמטי 100%</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 font-bold block">מנוע חכם</span>
              <span className="text-xl font-black text-sky-300">Gemini 3 AI</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 font-bold block">זיהוי ואבטחה</span>
              <span className="text-xl font-black text-purple-300">ביומטרי + RBAC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Commercial Nav Tabs */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-sm font-black select-none">
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen size={16} />
              <span>מדריך למשתמש (User Guide)</span>
            </button>

            <button
              onClick={() => setActiveTab('social')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === 'social'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <HeartHandshake size={16} />
              <span>חיי קהילה, זוגות ו"מי בא?"</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Award size={16} />
              <span>סטטיסטיקות אישיות מול קבוצתיות</span>
            </button>

            <button
              onClick={() => setActiveTab('communities')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === 'communities'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users size={16} />
              <span>רשת 10 הקהילות</span>
            </button>

            <button
              onClick={() => setActiveTab('tech')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === 'tech'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Cpu size={16} />
              <span>טכנולוגיה ו-AI</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck size={16} />
              <span>אבטחה ומידור נתונים</span>
            </button>

            <button
              onClick={() => setActiveTab('vision')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === 'vision'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Info size={16} />
              <span>אודות וצוות</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content Container */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
        
        {/* TAB 1: INTERACTIVE USER GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-8">
            {/* Search & Categories Bar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="relative">
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="חפש במדריך: איך מאשרים הגעה, מהו חבל זוג, נפח גלשן..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-4 py-3 text-sm font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { id: 'all', label: 'כל הנושאים' },
                  { id: 'sessions', label: 'סשנים ו"מי בא?"' },
                  { id: 'events', label: 'אירועים ומפגשים' },
                  { id: 'gallery', label: 'גלריה ו-AI' },
                  { id: 'duo', label: 'חבל זוג' },
                  { id: 'community', label: 'ספר הקהילה ופוסטים' },
                  { id: 'stats', label: 'אישי מול קהילתי' },
                  { id: 'gear', label: 'תנאי ים וציוד' },
                  { id: 'passport', label: 'דרכון והישגים' },
                  { id: 'core', label: 'כניסה והרשאות' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Guide Accordions */}
            <div className="space-y-4">
              {filteredGuides.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                  <HelpCircle size={40} className="mx-auto text-slate-300" />
                  <h3 className="text-lg font-black text-slate-700">לא נמצאו מדריכים התואמים את החיפוש</h3>
                  <p className="text-xs text-slate-500 font-bold">נסה לחפש מילות מפתח אחרות או לחץ על "כל הנושאים"</p>
                </div>
              ) : (
                filteredGuides.map(item => {
                  const isExpanded = expandedGuideId === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedGuideId(isExpanded ? null : item.id)}
                        className="w-full p-6 text-right flex items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black transition-colors ${
                            isExpanded ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-700'
                          }`}>
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                                {item.categoryLabel}
                              </span>
                              {item.badge && (
                                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <h3 className="text-base md:text-lg font-black text-slate-900 leading-snug">
                              {item.title}
                            </h3>
                          </div>
                        </div>

                        <ChevronDown 
                          size={20} 
                          className={`text-slate-400 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-sky-600' : ''}`} 
                        />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 px-6 pb-6 pt-4 bg-slate-50/50 space-y-4"
                          >
                            <p className="text-sm font-bold text-slate-600 leading-relaxed">
                              {item.summary}
                            </p>

                            <div className="space-y-2.5 pt-2">
                              <span className="text-xs font-black text-slate-800 block">צעדי הפעולה:</span>
                              {item.steps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-slate-700 leading-relaxed">
                                    {step}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {item.tips && (
                              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-950 text-xs font-bold leading-relaxed flex items-start gap-2.5">
                                <span className="text-base shrink-0">💡</span>
                                <span><strong>טיפ שימושי:</strong> {item.tips}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Quick Contact & Technical Shaper Help */}
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-sky-950 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1 text-center sm:text-right">
                <h4 className="text-lg font-black text-white flex items-center justify-center sm:justify-start gap-2">
                  <Headset size={20} className="text-cyan-400" />
                  <span>זקוק לעזרה נוספת או נתקלת בבעיה?</span>
                </h4>
                <p className="text-xs font-bold text-slate-300">
                  צוות התמיכה והאפ-שייפרים זמינים לסייע בכל שאלה טכנית או בקשה לשיוך קהילתי.
                </p>
              </div>

              <button
                onClick={() => navigate('/directory')}
                className="px-6 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs hover:bg-cyan-300 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
              >
                פתיחת ספר הכתובות
              </button>
            </div>
          </div>
        )}

        {/* TAB: SOCIAL & DUO PAIRS & WHO'S COMING */}
        {activeTab === 'social' && (
          <div className="space-y-8">
            {/* Header intro */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HeartHandshake size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">החיבורים החברתיים, חבלי זוג ו"מי בא לסשן?"</h3>
                  <p className="text-xs font-bold text-slate-500">הלב הפועם של הקהילה: מחויבות הדדית, שותפויות גלישה ויצירת קשר בלחיצה</p>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                הפלטפורמה נבנתה מתוך הבנה שגלישה וספורט ימי נשענים על שותפות וביטחון במים. כל התכונות החברתיות במערכת מתוכננות לעודד הגעה זוגית, שותפות אמיתית וחיבור קל ומהיר בין חברי הסניף.
              </p>
            </div>

            {/* Feature 1: Who's Coming */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">1. פיצ'ר "מי בא לסשן?" (Who's Coming)</h4>
                    <span className="text-xs font-bold text-slate-500">נוכחות חיה, פילוח שותפים וסדר במים</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-black border border-sky-200/60">בדף הבית</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <span className="text-xs font-black text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md inline-block">🪢 פילוח זוגות (Pairs)</span>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    מציג רק את חברי הקהילה שמגיעים יחד עם בן/בת הזוג שלהם לחבל. כרטיס זה זוהר בחיווי משותף ומעניק בונוס התמדה.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <span className="text-xs font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md inline-block">🏄‍♂️ פילוח סולו (Solo)</span>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    מציג גולשים שאישרו הגעה אך בן הזוג הקבוע שלהם נעדר בסשן זה. מאפשר למצוא שותף חלופי בחוף לפני הירידה למים.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">🛡️ מובילים ומדריכים</span>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    מציג את הרכזים והמדריכים המוסמכים שאישרו הגעה ומאבטחים את המפגש במים, כולל חיווי יחס חניכה בטוח.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: Duo Pairs & Buddy Boost */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                    <HeartHandshake size={18} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">2. חיבור חבלי זוג (Duo Pairs) ואפקט Buddy Boost</h4>
                    <span className="text-xs font-bold text-slate-500">שותפות הדדית שמזניקה את ההתמדה</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-black border border-amber-200/60">ערך ליבה</span>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 space-y-2">
                  <h5 className="font-black text-sm text-amber-950 flex items-center gap-2">
                    <span>🪢 מהו "חבל זוג"?</span>
                  </h5>
                  <p className="text-xs font-bold text-amber-900/90 leading-relaxed">
                    בדיוק כמו בצלילה חופשית ובטיפוס, אף גולש אינו לבד במים. לכל חבר מוגדר שותף פעילות קבוע. הגעתם יחד? המערכת מעניקה לשניכם את בונוס ההתמדה <strong>Buddy Boost</strong>, המקפיץ את מדד ה-Grit ומחזק את ההרגל.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-xs font-black text-slate-800 block">✨ חיווי "מגיעים יחד":</span>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                      כאשר שני בני הזוג אישרו הגעה, כרטיס המפגש מציג חיווי מוזהב "חבל זוג מגיעים יחד" שמודיע לכל הקהילה שאתם מתואמים.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-xs font-black text-slate-800 block">📲 תזכורת בלחיצה:</span>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                      אם בן/בת הזוג שלך טרם אישרו, מופיעה תגית "לא אישר/ה". לחיצה על כרטיס בן הזוג מאפשרת לשלוח לו תזכורת חברית בוואטסאפ או בשיחת טלפון.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Community Directory & Player Cards */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">3. ספר הקהילה (Directory) וכרטיסי שחקן</h4>
                    <span className="text-xs font-bold text-slate-500">ספר כתובות מודרני, קישור ישיר ותגיות הסמכה</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/directory')}
                  className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-black border border-purple-200/60 hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  מעבר לספר הקהילה ↗
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <h5 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-purple-600" />
                    <span>כרטיס שחקן אישי וצילום פדרו-אדג'</span>
                  </h5>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    לכל חבר כרטיס אישי הכולל תמונת פרופיל בעיצוב נוצות יוקרתי, כינוי, דרגת גלישה, הסמכות מקצועיות (וינגייט, צניחה, עזרה ראשונה) ושיוך חבל זוג.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <h5 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-purple-600" />
                    <span>קישור מהיר: וואטסאפ, טלפון ומייל</span>
                  </h5>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    בלחיצה אחת על כרטיס שחקן נפתחת אפשרות לשלוח הודעת WhatsApp ישירה, לחייג לטלפון הנייד או לשלוח דוא"ל לתיאום טרמפים וגלישה משותפת.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: STATS & ANALYTICS */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">מדדים ואנליטיקה: אישי מול קהילתי</h3>
                  <p className="text-xs font-bold text-slate-500">ארכיטקטורה כפולה: צבירה אישית לאורך החיים לצד בידוד קהילתי מוחלט</p>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                המערכת פותרת את האתגר של חברים הפעילים ביותר מקהילה אחת: הנתונים האישיים של הגולש הם רציפים ומצטברים, בעוד שהסטטיסטיקות והאחוזונים הקהילתיים מבודדים ומשקפים אך ורק את חברי הסניף הספציפי.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Statistics */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black">
                    <Flame size={16} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">סטטיסטיקות אישיות (Personal)</h4>
                    <span className="text-[11px] font-bold text-sky-600">גלובליות • מצטברות בכל הקהילות</span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  המסע האישי שלך שייך לך בלבד וממשיך איתך גם אם אתה גולש בהרצליה בבוקר ובתל ברוך בערב:
                </p>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <span className="text-sky-600 font-black">•</span>
                    <span className="text-xs font-bold text-slate-700"><strong>מדד התמדה (Grit Score):</strong> צובר נקודות מכל סשן שבו לקחת חלק בכל אחד מ-10 הסניפים.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <span className="text-sky-600 font-black">•</span>
                    <span className="text-xs font-bold text-slate-700"><strong>סך כל הסשנים (Total Attendance):</strong> מונה שעות ים והשתתפות מצטברות לכל החיים.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <span className="text-sky-600 font-black">•</span>
                    <span className="text-xs font-bold text-slate-700"><strong>דרכון אקסטרים והסמכות:</strong> תעודות וינגייט, ISA, דרגות מים (פופ-אפיסט וכו') וצניחה חופשית.</span>
                  </div>
                </div>
              </div>

              {/* Community Statistics */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">סטטיסטיקות קהילתיות (Community)</h4>
                    <span className="text-[11px] font-bold text-purple-600">מבודדות • יחסיות לסניף הפעיל</span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  מחושבות ומכוילות בזמן אמת אך ורק מול חברי הקהילה שאליה אתה מחובר כעת:
                </p>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <span className="text-purple-600 font-black">•</span>
                    <span className="text-xs font-bold text-slate-700"><strong>אחוזון גיל (Age Percentile):</strong> המיקום שלך יחסית לגילאי חברי הסניף הספציפי.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <span className="text-purple-600 font-black">•</span>
                    <span className="text-xs font-bold text-slate-700"><strong>אחוזון מרחק נסיעה:</strong> מיקומך במרחק ההגעה לחוף ביחס לשאר חברי הקהילה.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <span className="text-purple-600 font-black">•</span>
                    <span className="text-xs font-bold text-slate-700"><strong>ממוצע נפח גלשנים (Volume Avg):</strong> אפיון ציוד הגלישה הייחודי לקהילה המקומית.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <span className="text-purple-600 font-black">•</span>
                    <span className="text-xs font-bold text-slate-700"><strong>דופק הקהילה (Community Pulse):</strong> גרפי מגמות עונתיים של הסניף בלבד.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMMUNITIES NETWORK */}
        {activeTab === 'communities' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Waves size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">רשת 10 הקבוצות של קהילת חבל זוג</h3>
                  <p className="text-xs font-bold text-slate-500">כל קבוצה מבודדת ברמת מסד הנתונים, הסבבים (סבב א׳ ו-ב׳) ורשימות הסשנים</p>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                קהילת חבל זוג מאגדת כיום 10 קבוצות גלישה ברחבי ישראל. כל קבוצה פועלת במועדון או חוף ייעודי ומפעילה לוח סשנים עצמאי, חלוקה לסבבי גלישה (סבב א׳ ו-סבב ב׳ לסירוגין או סשן מאוחד), רשימות חבלי זוג ומוני נוכחות מבודדים לחלוטין.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                {AVAILABLE_COMMUNITIES.map((c, index) => {
                  const isCurrent = c.id === currentCommunityId;
                  return (
                    <div 
                      key={c.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-sky-500/10 border-sky-400 shadow-sm'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-black text-slate-400">#0{index + 1}</span>
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-black">
                            <CheckCircle2 size={11} /> מחובר כרגע
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">סניף פעיל</span>
                        )}
                      </div>
                      <h4 className="text-base font-black text-slate-900 mb-1">{c.name}</h4>
                      <p className="text-[11px] font-bold text-slate-500">
                        סביבה מבודדת • סשנים עצמאיים
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Architecture Explanation Box */}
            <div className="bg-sky-50/60 rounded-3xl p-6 border border-sky-200/80 space-y-3">
              <h4 className="text-sm font-black text-sky-950 flex items-center gap-2">
                <ShieldCheck size={16} className="text-sky-600" />
                <span>כיצד עובד המידור הקהילתי בפועל?</span>
              </h4>
              <p className="text-xs font-bold text-sky-900/90 leading-relaxed">
                כאשר אתה מתחבר לקבוצת "הרצליה - בוגרים", אישורי ההגעה שלך נשמרים בנתיב ייעודי <code>active_session_herzliya_adults</code>. 
                משתמשים מקבוצת הרצליה הרגילה או מתל ברוך אינם רואים את פעילותך, ורשימת החברים מוגנת מפני כל זליגת מידע חיצונית.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: TECHNOLOGY & AI */}
        {activeTab === 'tech' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">הטכנולוגיה, ה-AI והמנוע שמאחורי הקלעים</h3>
                  <p className="text-xs font-bold text-slate-500">אלגוריתמיקה ימית מתקדמת בשילוב מודלי שפה של Google</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                    <Sparkles size={16} />
                  </div>
                  <h4 className="text-base font-black text-slate-900">שילוב Google Gemini 3 AI</h4>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    מנוע ה-AI של Gemini משולב בגלריה הקהילתית לניתוח ויזואלי של תמונות גלישה, זיהוי גלשנים ומאפייני ים, וכתיבת כותרות פואטיות ומעוררות השראה. כמו כן, הוא מסייע בניתוח תנאי הים ובניסוח ביוגרפיות גולשים.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                    <Waves size={16} />
                  </div>
                  <h4 className="text-base font-black text-slate-900">טלמטריה ימית וחיזוי גלים חי</h4>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    אינטגרציה עם מצופים ימיים ומודלים מטאורולוגיים מתקדמים (Open-Meteo, Stormglass ו-GoSurf). המערכת מעבדת גובה גל, כיוון סוול (Swell Period), וטמפרטורת מים ומספקת המלצות ביגוד וגלשן בזמן אמת.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <Award size={16} />
                  </div>
                  <h4 className="text-base font-black text-slate-900">אלגוריתם ה-Grit Score</h4>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    נוסחה מתמטית מורכבת המתגמלת רציפות שבועית, נוכחות בתנאי ים מאתגרים, סנכרון חבל זוג (Buddy Boost) והתמדה לאורך עונות השנה.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                    <Database size={16} />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Real-Time Cloud Firestore</h4>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    סנכרון מיידי בין כלל המכשירים והגולשים ללא צורך בריענון דף. אישורי הגעה וסגירות סשנים משתקפים תוך מילישניות אצל כל חברי הקהילה.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY & ISOLATION */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">אבטחת מידע, פרטיות ואמנת הארגון</h3>
                  <p className="text-xs font-bold text-slate-500">עקרונות המידור וההגנה על פרטיות חברי הקהילה</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>אכיפת הרשאות הדוקה (Strict RBAC)</span>
                  </h4>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    גישה לפונקציות ניהול, הגדרות מערכת, חדר מכונות ומעקבי נוכחות שמורה אך ורק לרכזים וצוות עמותה מורשה. מתנדבים ומשתתפים נהנים מממשק נקי וממודר לחלוטין ללא שום חשיפה למידע ניהולי רגיש.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Lock size={16} className="text-emerald-600" />
                    <span>נעילת שיוך קהילתי (Anti-Tampering)</span>
                  </h4>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    משתמשים רגילים אינם יכולים לשנות בעצמם את שיוך הקהילות שלהם בפרופיל האישי. השיוך מוצג במצב Read-Only בלבד, ונקבע אך ורק על ידי רכזי הסניף.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Eye size={16} className="text-emerald-600" />
                    <span>הצפנת נתונים והזדהות ביומטרית</span>
                  </h4>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    סיסמאות משתמשים עוברות גיבוב מוצפן (SHA-256) ואינן נשמרות כטקסט קריא. ההזדהות הביומטרית פועלת ישירות מול שבב האבטחה המקומי של המכשיר שלך ואינה מעבירה טביעות אצבע לרשת.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: VISION & TEAM */}
        {activeTab === 'vision' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HeartHandshake size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">החזון והאנשים מאחורי הפרויקט</h3>
                  <p className="text-xs font-bold text-slate-500">עמותת הגלישה, חברי הקהילה והרוח הימית</p>
                </div>
              </div>

              <div className="space-y-4 text-sm font-bold text-slate-700 leading-relaxed">
                <p>
                  פלטפורמת <strong>חבל זוג</strong> נולדה מתוך החול והגלים, במטרה להעצים את הקהילתיות, החברות וההתמדה של גולשים בכל הגילאים והרמות.
                </p>
                <p>
                  הרעיון המנחה הוא שגלישה איננה רק ספורט אינדיבידואלי, אלא מסגרת מעצימה המבוססת על שותפות ("חבל זוג"), ערבות הדדית ואהבה אמיתית לים.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">גרסת מערכת</span>
                  <span className="text-base font-black text-slate-800">BodyLine Enterprise v2.8</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">פיתוח ועיצוב מוצר</span>
                  <span className="text-base font-black text-slate-800">App-Shaper Team</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">רישוי וזכויות</span>
                  <span className="text-base font-black text-slate-800">© 2026 כל הזכויות שמורות</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <ArrowRight size={14} />
                  <span>חזרה לדף הבית</span>
                </button>

                <button
                  onClick={() => navigate('/shaper')}
                  className="text-xs font-black text-sky-600 hover:text-sky-800 transition-colors cursor-pointer"
                >
                  מעבר לחדר השייפר 🔨
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AboutPage;
