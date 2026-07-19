const fs = require('fs');

const replaceInFile = (file, map) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(map)) {
    content = content.replace(new RegExp(key, 'g'), value);
  }
  fs.writeFileSync(file, content);
};

replaceInFile('src/components/CommunityAnalytics.tsx', {
  'חברי הקהילה': 'משתתפי הקהילה',
  'רשימת החברים': 'רשימת המשתמשים',
  'כל החברים': 'כל המשתמשים',
  'אין חברים': 'אין משתמשים',
  'החברים': 'המשתמשים',
  ' חברים ': ' משתמשים ',
  ' חברים<': ' משתמשים<'
});

replaceInFile('src/components/CommunityHeatMap.tsx', {
  'חברי הקהילה': 'משתתפי הקהילה',
  'צפיפות חברים': 'צפיפות משתמשים',
  ' חברים<': ' משתמשים<'
});

replaceInFile('src/pages/DirectoryPage.tsx', {
  'לא נמצאו חברים': 'לא נמצאו משתמשים'
});

