const fs = require('fs');
let content = fs.readFileSync('src/pages/SurfingSessionAttendance.tsx', 'utf8');

content = content.replace(/חברים רשומים/g, "נרשמו למפגש");
content = content.replace(/לחץ על חבר לעדכון נוכחות/g, "לחץ על משתתף לעדכון נוכחות");
content = content.replace(/חיפוש חבר בקהילה\.\.\./g, "חיפוש בקהילה...");

fs.writeFileSync('src/pages/SurfingSessionAttendance.tsx', content);
