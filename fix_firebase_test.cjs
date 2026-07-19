const fs = require('fs');
let content = fs.readFileSync('src/services/firebase.ts', 'utf8');

content = content.replace(
  'console.error("Firestore connection test: FAILED", { code: errCode, message: errMsg });',
  `if (errCode !== 'permission-denied') {
      console.error("Firestore connection test: FAILED", { code: errCode, message: errMsg });
    }`
);

fs.writeFileSync('src/services/firebase.ts', content);
