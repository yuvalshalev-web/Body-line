export const DEFAULT_MEMBER_SURFBOARD = {
  type: 'Beginner Softboard (Soft-Top / Foamie)',
  name: 'Softboard',
  nameHebrew: 'סופטבורד ארוך',
  volume: 112,
  length: "8'0\"",
  lengthFeet: 8,
  lengthInches: 0,
  description: 'גלשן ברירת מחדל: סופטבורד ארוך 8\'0" בנפח 112 ליטר לציפה ויציבות מרביות.'
};

export const SURFBOARD_CATALOG = [
  { 
    id: '1', 
    name: 'Shortboard', 
    nameEn: 'Shortboard',
    type: 'shortboard', 
    minVolume: 25, 
    maxVolume: 35,
    lengthRange: "5'6\" - 6'4\"",
    volumeRange: "25L - 35L",
    description: "גלשן קצר ומהיר המיועד לגלים בינוניים עד גבוהים ולביצועים חדים.",
    bottomLine: "מתאים לגולשים מנוסים המחפשים ביצועים."
  },
  { 
    id: '2', 
    name: 'Longboard', 
    nameEn: 'Longboard',
    type: 'longboard', 
    minVolume: 60, 
    maxVolume: 80,
    lengthRange: "8'0\" - 10'0\"",
    volumeRange: "60L - 80L",
    description: "גלשן ארוך ויציב, מושלם לגלים קטנים ולגלישה קלאסית.",
    bottomLine: "מתאים לכל הרמות, במיוחד לימים עם גלים חלשים."
  },
  { 
    id: '3', 
    name: 'Funboard', 
    nameEn: 'Funboard',
    type: 'funboard', 
    minVolume: 35, 
    maxVolume: 50,
    lengthRange: "6'6\" - 7'6\"",
    volumeRange: "35L - 50L",
    description: "שילוב בין שורטבורד ללונגבורד, מציע יציבות ויכולת תמרון.",
    bottomLine: "מעולה לגולשים מתחילים-בינוניים שרוצים להתקדם."
  },
  { 
    id: '4', 
    name: 'Softboard', 
    nameEn: 'Softboard',
    type: 'softboard', 
    minVolume: 45, 
    maxVolume: 90,
    lengthRange: "6'0\" - 9'0\"",
    volumeRange: "45L - 90L",
    description: "גלשן רך ובטוח, מציף מאוד וסלחן לטעויות.",
    bottomLine: "הבחירה המושלמת לגולשים מתחילים ולבתי ספר לגלישה."
  },
  { 
    id: '5', 
    name: 'Fish', 
    nameEn: 'Fish',
    type: 'fish', 
    minVolume: 30, 
    maxVolume: 45,
    lengthRange: "5'4\" - 6'2\"",
    volumeRange: "30L - 45L",
    description: "גלשן קצר ורחב עם זנב סנונית, מהיר מאוד בגלים קטנים וחלשים.",
    bottomLine: "מעולה לימי קיץ ולגלים שאין בהם הרבה כוח."
  },
  { 
    id: '6', 
    name: 'SUP (סאפ)', 
    nameEn: 'SUP',
    type: 'sup', 
    minVolume: 120, 
    maxVolume: 250,
    lengthRange: "9'0\" - 12'0\"",
    volumeRange: "120L - 250L",
    description: "גלשן חתירה בעמידה, גדול ויציב מאוד. זמין בגרסה קשיחה או מתנפחת (iSUP).",
    bottomLine: "מושלם לימים ללא גלים, לאימון כושר ולטיולים ימיים."
  }
];
