const fs = require('fs');
let content = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');

const listener = `
    const unsubSurfCalls = trackedOnSnapshot(query(collection(db, 'surf_calls')), (snapshot) => {
      setSurfCalls(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SurfCall)));
    });
`;

content = content.replace(
  "const unsubEvents = trackedOnSnapshot(",
  listener + "\n    const unsubEvents = trackedOnSnapshot("
);

content = content.replace(
  "unsubEvents();",
  "unsubEvents();\n      unsubSurfCalls();"
);

fs.writeFileSync('src/contexts/DataContext.tsx', content);
