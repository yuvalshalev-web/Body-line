const fs = require('fs');
let content = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');

content = content.replace(
  "const isAttending = joined.some(p => p.id === memberId);",
  "const isAttending = joined.some((p: any) => p.id === memberId);"
);
content = content.replace(
  "newJoined = newJoined.filter(p => p.id !== memberId);",
  "newJoined = newJoined.filter((p: any) => p.id !== memberId);"
);

fs.writeFileSync('src/contexts/DataContext.tsx', content);
