const fs = require('fs');

let adminContent = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');
adminContent = adminContent.replace(
  "{ id: 'SURF_CALLS', label: 'מי בא למים?', icon: <Waves size={20} /> },",
  "{ id: 'SURF_CALLS', label: 'מי בא לגלוש?', icon: <Waves size={20} /> },"
);
fs.writeFileSync('src/pages/AdminPage.tsx', adminContent);

let analyticsContent = fs.readFileSync('src/components/admin/SurfCallsAnalytics.tsx', 'utf8');
analyticsContent = analyticsContent.replace(
  "מי בא למים?",
  "מי בא לגלוש?"
);
fs.writeFileSync('src/components/admin/SurfCallsAnalytics.tsx', analyticsContent);

