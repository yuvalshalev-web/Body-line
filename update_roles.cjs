const fs = require('fs');

const editMemberFormFile = 'src/components/admin/EditMemberForm.tsx';
let editContent = fs.readFileSync(editMemberFormFile, 'utf8');

editContent = editContent.replace(/grid-cols-3/g, 'grid-cols-4');
editContent = editContent.replace(/max-w-\[380px\]/g, 'max-w-[460px]');
editContent = editContent.replace(
  "{ id: 'Member', label: 'חבר' },\n                    { id: 'Instructor', label: 'מדריך' },\n                    { id: 'Admin', label: 'רכז' }",
  "{ id: 'Member', label: 'משתתף' },\n                    { id: 'Volunteer', label: 'מתנדב' },\n                    { id: 'Instructor', label: 'מדריך' },\n                    { id: 'Admin', label: 'רכז' }"
);
editContent = editContent.replace(/השעיית חבר/g, 'השעיית משתמש');
editContent = editContent.replace(/שחרור חבר/g, 'שחרור משתמש');
editContent = editContent.replace(/השעה חבר/g, 'השעה משתמש');
editContent = editContent.replace(/שחרר חבר/g, 'שחרר משתמש');
editContent = editContent.replace(/החבר הושעה/g, 'המשתמש הושעה');
editContent = editContent.replace(/החבר הוחזר/g, 'המשתמש הוחזר');
editContent = editContent.replace(/החלפת סיסמה לחבר/g, 'החלפת סיסמה למשתמש');

fs.writeFileSync(editMemberFormFile, editContent);


const addMemberModalFile = 'src/components/admin/AddMemberModal.tsx';
let addContent = fs.readFileSync(addMemberModalFile, 'utf8');

addContent = addContent.replace(/newMemberData\.role === 'Admin' \? 'רכז' : newMemberData\.role === 'Instructor' \? 'מדריך' : 'חבר'/g, "newMemberData.role === 'Admin' ? 'רכז' : newMemberData.role === 'Instructor' ? 'מדריך' : newMemberData.role === 'Volunteer' ? 'מתנדב' : 'משתתף'");
addContent = addContent.replace(/\(\['Member', 'Instructor', 'Admin'\] as const\)/g, "(['Member', 'Volunteer', 'Instructor', 'Admin'] as const)");
addContent = addContent.replace(/r === 'Admin' \? 'רכז' : r === 'Instructor' \? 'מדריך' : 'חבר'/g, "r === 'Admin' ? 'רכז' : r === 'Instructor' ? 'מדריך' : r === 'Volunteer' ? 'מתנדב' : 'משתתף'");
addContent = addContent.replace(/חבר נוסף בהצלחה!/g, "משתמש נוסף בהצלחה!");
addContent = addContent.replace(/הוספת חבר חדש/g, "הוספת משתמש חדש");
addContent = addContent.replace(/שגיאה בהוספת חבר/g, "שגיאה בהוספת משתמש");
addContent = addContent.replace(/שמור חבר חדש/g, "שמור משתמש חדש");

fs.writeFileSync(addMemberModalFile, addContent);

const importModalFile = 'src/components/admin/ImportMembersModal.tsx';
let importContent = fs.readFileSync(importModalFile, 'utf8');
importContent = importContent.replace(/ייבוא חברים מקובץ CSV/g, "ייבוא משתמשים מקובץ CSV");
importContent = importContent.replace(/יובאו בהצלחה \$\{successCount\} חברים חדשים/g, "יובאו בהצלחה ${successCount} משתמשים חדשים");
fs.writeFileSync(importModalFile, importContent);

