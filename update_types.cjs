const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('SurfCall')) {
  content += `\nexport interface SurfCall {
  id: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  targetBeach: string;
  targetDate: string;
  targetTime: string;
  text?: string;
  participantsJoined: { id: string; name: string; avatar?: string }[];
  participantsCancelled: string[];
  isArchived?: boolean;
}\n`;
}

fs.writeFileSync('src/types.ts', content);
