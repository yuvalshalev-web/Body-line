const fs = require('fs');

// Fix types.ts
let typesContent = fs.readFileSync('src/types.ts', 'utf8');
typesContent = typesContent.replace(
  "participantsCancelled: string[];",
  "participantsCancelled: string[];\n  comments?: { id: string; userId: string; userName: string; avatar?: string; text: string; timestamp: string }[];"
);
fs.writeFileSync('src/types.ts', typesContent);

// Fix DataContextType
let dataContextContent = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');
const dataContextAdditions = `  addSurfCall: (details: Omit<SurfCall, 'id' | 'createdAt' | 'participantsJoined' | 'participantsCancelled' | 'creatorId' | 'creatorName'>, userId: string, userName: string) => Promise<void>;
  toggleSurfCallAttendance: (callId: string, userId: string, userName: string, avatar?: string) => Promise<void>;
  archiveSurfCall: (callId: string) => Promise<void>;
  addSurfCallComment: (callId: string, userId: string, userName: string, avatar: string | undefined, text: string) => Promise<void>;`;

dataContextContent = dataContextContent.replace(
  "seedInitialAssets: () => Promise<void>;\n}",
  `seedInitialAssets: () => Promise<void>;\n${dataContextAdditions}\n}`
);

fs.writeFileSync('src/contexts/DataContext.tsx', dataContextContent);

