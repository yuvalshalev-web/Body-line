const fs = require('fs');
let content = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');

content = content.replace(/משתמש זה אינו רשום במערכת כחבר\./g, "משתמש זה אינו מאושר עדיין במערכת.");

fs.writeFileSync('src/pages/LoginPage.tsx', content);
