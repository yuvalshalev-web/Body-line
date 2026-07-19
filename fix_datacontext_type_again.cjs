const fs = require('fs');
let content = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');

content = content.replace(
  "addSurfCall: (details: Omit<SurfCall, 'id' | 'createdAt' | 'participantsJoined' | 'participantsCancelled' | 'creatorId' | 'creatorName'>, userId: string, userName: string) => Promise<void>;",
  "addSurfCall: (call: Omit<SurfCall, 'id'>) => Promise<string>;"
);

fs.writeFileSync('src/contexts/DataContext.tsx', content);
