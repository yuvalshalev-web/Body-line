const fs = require('fs');
let content = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');

content = content.replace(/\{role === 'Admin' \? 'רכז' : 'חבר נבחרת'\}/g, "{role === 'Admin' ? 'רכז' : role === 'Instructor' ? 'מדריך' : role === 'Volunteer' ? 'מתנדב' : 'משתתף נבחרת'}");
content = content.replace(/חבר מאז/g, "בקהילה מאז");

fs.writeFileSync('src/pages/ProfilePage.tsx', content);
