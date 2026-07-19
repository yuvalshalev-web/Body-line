const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');

const newRule = `
    match /surf_calls/{callId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAdmin() || isAuthenticated();
      allow delete: if isAdmin() || (isAuthenticated() && resource.data.creatorId == request.auth.uid);
    }
`;

content = content.replace(
  "    // Default deny",
  newRule + "    // Default deny"
);

fs.writeFileSync('firestore.rules', content);
