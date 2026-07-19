const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

content = content.replace(
  "{ id: 'EVENTS', label: 'אירועים', icon: <Calendar size={20} /> },",
  "{ id: 'EVENTS', label: 'אירועים', icon: <Calendar size={20} /> },\n    { id: 'SURF_CALLS', label: 'מי בא למים?', icon: <Waves size={20} /> },"
);

// We need to import Waves if not imported
if (!content.includes('Waves')) {
  content = content.replace(
    "Activity,",
    "Activity,\n  Waves,"
  );
}

fs.writeFileSync('src/pages/AdminPage.tsx', content);
