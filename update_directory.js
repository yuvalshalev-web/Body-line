const fs = require('fs');
let content = fs.readFileSync('src/pages/DirectoryPage.tsx', 'utf8');

const translateRole = (roleVar) => `${roleVar}.role === 'Admin' ? 'רכז' : ${roleVar}.role === 'Instructor' ? 'מדריך' : ${roleVar}.role === 'Volunteer' ? 'מתנדב' : 'משתתף'`;

content = content.replace(/const identities = \['הכל', 'רכז', 'מדריך', 'חבר'\];/, "const identities = ['הכל', 'רכז', 'מדריך', 'מתנדב', 'משתתף'];");
content = content.replace(/member\.role === 'Admin' \? 'רכז' : member\.role === 'Instructor' \? 'מדריך' : 'חבר'/g, translateRole('member'));
content = content.replace(/const roleOrder: Record<string, number> = \{ 'רכז': 1, 'מדריך': 2, 'חבר': 3 \};/, "const roleOrder: Record<string, number> = { 'רכז': 1, 'מדריך': 2, 'מתנדב': 3, 'משתתף': 4 };");
content = content.replace(/a\.role === 'Admin' \? 'רכז' : a\.role === 'Instructor' \? 'מדריך' : 'חבר'/g, translateRole('a'));
content = content.replace(/b\.role === 'Admin' \? 'רכז' : b\.role === 'Instructor' \? 'מדריך' : 'חבר'/g, translateRole('b'));
content = content.replace(/currentRole === 'רכז' \? 'רכזים' : currentRole === 'מדריך' \? 'מדריכים' : 'חברים'/g, "currentRole === 'רכז' ? 'רכזים' : currentRole === 'מדריך' ? 'מדריכים' : currentRole === 'מתנדב' ? 'מתנדבים' : 'משתתפים'");
content = content.replace(/חברים רשומים 🏄‍♂️/g, "משתתפים רשומים 🏄‍♂️");
content = content.replace(/לא נמצאו חברים התואמים לחיפוש/g, "לא נמצאו משתתפים או מתנדבים התואמים לחיפוש");

fs.writeFileSync('src/pages/DirectoryPage.tsx', content);
