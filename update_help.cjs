const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminHelpPage.tsx', 'utf8');

content = content.replace(/חברים/g, "משתמשים");
content = content.replace(/לחברים/g, "למשתמשים");
content = content.replace(/מהחברים/g, "מהמשתמשים");
content = content.replace(/החברים/g, "המשתמשים");
content = content.replace(/חבר/g, "משתמש");
content = content.replace(/לחבר/g, "למשתמש");
content = content.replace(/החבר/g, "המשתמש");

fs.writeFileSync('src/components/admin/AdminHelpPage.tsx', content);
