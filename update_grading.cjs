const fs = require('fs');
let content = fs.readFileSync('src/pages/MemberGradingPage.tsx', 'utf8');

content = content.replace(/לחברי הקהילה/g, "למשתתפי הקהילה");
content = content.replace(/חיפוש חבר להערכה\.\.\./g, "חיפוש להערכה...");

fs.writeFileSync('src/pages/MemberGradingPage.tsx', content);
