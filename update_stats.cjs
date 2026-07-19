const fs = require('fs');
let content = fs.readFileSync('src/pages/SessionStatsPage.tsx', 'utf8');

content = content.replace(/חברי הקהילה/g, "משתתפי הקהילה");
content = content.replace(/סה״כ חברים/g, "סה״כ משתתפים");
content = content.replace(/חברים/g, "משתתפים");

fs.writeFileSync('src/pages/SessionStatsPage.tsx', content);
