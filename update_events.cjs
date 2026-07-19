const fs = require('fs');
let content = fs.readFileSync('src/pages/EventsPage.tsx', 'utf8');

content = content.replace(
  /if \(e\.type === 'COMMUNITY' \|\| e\.type === 'MEMBER'\) return true;/g,
  "if (e.type === 'COMMUNITY') return true;\n    if (e.type === 'MEMBER' && currentUser?.role === 'Member') return true;"
);

fs.writeFileSync('src/pages/EventsPage.tsx', content);
