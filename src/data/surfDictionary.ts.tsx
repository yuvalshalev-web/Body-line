export interface SurfTerm {
  id: number;
  term: string;
  definition: string;
  category?: string;
}

export const SURF_DICTIONARY: SurfTerm[] = [
  // --- מבנה הגלשן וחומרים ---
  { id: 1, term: "אפוקסי (Epoxy)", definition: "חומר מתקדם, קל וחזק המשמש לבניית גלשנים מודרניים ועמידים.", category: "ציוד" },
  { id: 2, term: "אאוטליין (Outline)", definition: "קו המתאר הכללי של הגלשן במבט מלמעלה, המשפיע על היציבות והזריזות.", category: "ציוד" },
  { id: 3, term: "דק (Deck)", definition: "החלק העליון של הגלשן עליו עומד הגולש.", category: "ציוד" },
  { id: 4, term: "בוטום (Bottom)", definition: "החלק התחתון של הגלשן הנוגע במים, משפיע על המהירות והתמרון.", category: "ציוד" },
  { id: 5, term: "ריילים (Rails)", definition: "דפנות הגלשן המחברות בין הדק לתחתית. ריילים חדים נותנים אחיזה חזקה בפניות.", category: "ציוד" },
  { id: 6, term: "רוקר (Rocker)", definition: "הקימור האורכי של הגלשן מהחרטום לזנב. רוקר גבוה עוזר בתמרון בגלים תלולים.", category: "ציוד" },
  { id: 7, term: "סטרינגר (Stringer)", definition: "פס עץ העובר במרכז הגלשן לחיזוק השדרה שלו.", category: "ציוד" },
  { id: 8, term: "זנב (Tail)", definition: "החלק האחורי של הגלשן. צורות שונות (Squash, Swallow, Pin) משפיעות על שחרור המים.", category: "ציוד" },
  { id: 9, term: "חרטום (Nose)", definition: "החלק הקדמי של הגלשן. שפיצי בשורטבורד ומעוגל בלונגבורד.", category: "ציוד" },
  { id: 10, term: "נפח (Volume)", definition: "כמות הליטרים בגלשן הקובעת את כושר הציפה והקלות בתפיסת גלים.", category: "ציוד" },
  { id: 11, term: "אסטרודק (Astrodeck)", definition: "משטח גומי (Traction Pad) המודבק על זנב הגלשן לאחיזה טובה יותר של הרגל האחורית.", category: "ציוד" },

  // --- תצורות סנפירים (חרבות) ---
  { id: 12, term: "חרבות (Fins)", definition: "סנפירים המייצבים את הגלשן ומאפשרים פניות.", category: "ציוד" },
  { id: 13, term: "טראסטר (Thruster)", definition: "מערכת של 3 סנפירים - התצורה הנפוצה ביותר המאזנת בין מהירות לשליטה.", category: "ציוד" },
  { id: 14, term: "טווין פין (Twin Fin)", definition: "מערכת של 2 סנפירים המעניקה תחושה משוחררת וזריזה.", category: "ציוד" },
  { id: 15, term: "קוואד (Quad)", definition: "מערכת של 4 סנפירים המייצרת מהירות גבוהה במיוחד.", category: "ציוד" },

  // --- תנאי ים ומטאורולוגיה ---
  { id: 16, term: "אופשור (Offshore)", definition: "רוח הנושבת מהחוף לים. הרוח האידיאלית שמחליקה ומסדרת את הגלים.", category: "תנאים" },
  { id: 17, term: "אונשור (Onshore)", definition: "רוח מהים לחוף המבלגנת את הגלים וגורמת להם להישבר מוקדם.", category: "תנאים" },
  { id: 18, term: "קרוס-שור (Cross-shore)", definition: "רוח צד הנושבת במקביל לחוף.", category: "תנאים" },
  { id: 19, term: "גראונד סוול (Ground Swell)", definition: "גלים שנוצרו בסערה רחוקה והגיעו מסודרים וחזקים לחוף.", category: "תנאים" },
  { id: 20, term: "ווינד סוול (Wind Swell)", definition: "גלים מקומיים קצרים ולא מסודרים שנוצרים מרוח קרובה.", category: "תנאים" },
  { id: 21, term: "סט (Set)", definition: "קבוצה של מספר גלים גדולים המגיעים יחד במחזוריות.", category: "תנאים" },
  { id: 22, term: "לול (Lull)", definition: "ההפוגה השקטה בין הסטים של הגלים.", category: "תנאים" },
  { id: 23, term: "צ'ופי (Choppy)", definition: "מצב ים מבולגן עם גלגלונים קטנים המקשים על הגלישה.", category: "תנאים" },
  { id: 24, term: "קלוזאאוט (Closeout)", definition: "גל שנשבר לכל אורכו בבת אחת ולא מאפשר גלישה לצדדים.", category: "תנאים" },
  { id: 25, term: "ריפ (Rip Current)", definition: "זרם חזק החוזר מהחוף לעומק הים דרך תעלה עמוקה.", category: "תנאים" },

  // --- טכניקה ותמרונים ---
  { id: 26, term: "טייק אוף (Takeoff)", definition: "הרגע הקריטי של המעבר מחתירה לירידה על הגל.", category: "טכניקה" },
  { id: 27, term: "פופ אפ (Pop-up)", definition: "קפיצה מהירה משכיבה לעמידה על הגלשן.", category: "טכניקה" },
  { id: 28, term: "בוטום טרן (Bottom Turn)", definition: "הפנייה הראשונה בתחתית הגל המייצרת מהירות להמשך הגל.", category: "טכניקה" },
  { id: 29, term: "טופ טרן (Top Turn)", definition: "פנייה בחלקו העליון של הגל.", category: "טכניקה" },
  { id: 30, term: "קאטבק (Cutback)", definition: "תמרון של חזרה מהכתף של הגל לכיוון הקצף כדי להישאר באזור הכוח.", category: "טכניקה" },
  { id: 31, term: "סנאפ (Snap)", definition: "תנועה חדה ומהירה בראש הגל המתיזה מים לכל עבר.", category: "טכניקה" },
  { id: 32, term: "דאק דייב (Duck Dive)", definition: "צלילת ברווז - מעבר מתחת לגל נשבר בזמן חתירה לעומק.", category: "טכניקה" },
  { id: 33, term: "טרים (Trim)", definition: "מציאת הקו האופטימלי על הגל למהירות מקסימלית ללא מאמץ.", category: "טכניקה" },
  { id: 34, term: "פאמפ (To Pump)", definition: "יצירת מהירות על ידי דחיפות קצביות של הגלשן מעלה ומטה.", category: "טכניקה" },
  { id: 35, term: "סטול (Stall)", definition: "האטה מכוונת של הגלשן על ידי העברת משקל לזנב.", category: "טכניקה" },
  { id: 36, term: "פלואוטר (Floater)", definition: "גלישה על שפת הגל הנשבר מעל הקצף.", category: "טכניקה" },

  // --- חלקי הגל וסוגי גלים ---
  { id: 37, term: "פיק (Peak)", definition: "הנקודה הכי גבוהה בגל שבה הוא מתחיל להישבר.", category: "הגל" },
  { id: 38, term: "פייס (Face)", definition: "החלק הפתוח והחלק של הגל שעדיין לא נשבר.", category: "הגל" },
  { id: 39, term: "ליפ (Lip)", definition: "שפת הגל ש'נזרקת' קדימה בזמן השבירה.", category: "הגל" },
  { id: 40, term: "צינור (Barrel/Tube)", definition: "המצב בו הגל מתקפל מעל הגולש ויוצר חלל סגור.", category: "הגל" },
  { id: 41, term: "איי פריים (A-frame)", definition: "גל שנשבר לשני הצדדים (ימינה ושמאלה) בו זמנית מהפיק.", category: "הגל" },
  { id: 42, term: "קצף (Whitewash)", definition: "המים הלבנים שנוצרים לאחר שהגל נשבר.", category: "הגל" },
  { id: 43, term: "טראף (Trough)", definition: "העמק שבין שני גלים.", category: "הגל" },

  // --- סלנג ותרבות גלישה ---
  { id: 44, term: "קוק (Kook)", definition: "גולש מתחיל שלא מכיר את חוקי האתיקה או מסכן אחרים.", category: "תרבות" },
  { id: 45, term: "שוחט (Ripper)", definition: "סלנג לגולש מתקדם מאוד שמבצע ביצועים חזקים.", category: "תרבות" },
  { id: 46, term: "לוקאל (Local)", definition: "גולש קבוע בחוף מסוים שרואה בו את הבית שלו.", category: "תרבות" },
  { id: 47, term: "סטוקד (Stoked)", definition: "תחושת התלהבות ואושר עילאי אחרי גלישה טובה.", category: "תרבות" },
  { id: 48, term: "שאקה (Shaka)", definition: "מחווה של גולשים (אגודל וזרת) המסמלת אחווה ורוגע.", category: "תרבות" },
  { id: 49, term: "ליין אפ (Line-up)", definition: "האזור שבו הגולשים ממתינים בתור לגלים מחוץ לאזור השבירה.", category: "תרבות" },
  { id: 50, term: "סנייק (Snake)", definition: "פעולה של עקיפת גולש אחר כדי לגנוב לו את זכות הקדימה על הגל.", category: "תרבות" },
  { id: 51, term: "ווייפאאוט (Wipeout)", definition: "נפילה מהגלשן, בדרך כלל כזו שכוללת 'כביסה' בתוך המים.", category: "תרבות" },
  
  // --- עולם הפויל והחדשנות ---
  { id: 52, term: "פויל (Foil)", definition: "כנף תת-ימית המרימה את הגלשן מעל פני המים.", category: "פויל" },
  { id: 53, term: "תורן (Mast)", definition: "המוט האנכי המחבר בין הגלשן לכנפיים של הפויל.", category: "פויל" },
  { id: 54, term: "ברייץ' (Breach)", definition: "כאשר כנף הפויל יוצאת מהמים בטעות וגורמת לנפילה.", category: "פויל" }
];

export const getRandomTerm = (): SurfTerm => {
  return SURF_DICTIONARY[Math.floor(Math.random() * SURF_DICTIONARY.length)];
};