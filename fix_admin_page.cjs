const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

content = content.replace(
  "useState<'DASHBOARD' | 'REQUESTS' | 'USERS' | 'POSTS' | 'GALLERY' | 'EVENTS' | 'ROLLOVER' | 'ENGINE_ROOM' | 'ASSETS'>",
  "useState<'DASHBOARD' | 'REQUESTS' | 'USERS' | 'POSTS' | 'GALLERY' | 'EVENTS' | 'ROLLOVER' | 'ENGINE_ROOM' | 'ASSETS' | 'SURF_CALLS'>"
);

fs.writeFileSync('src/pages/AdminPage.tsx', content);
