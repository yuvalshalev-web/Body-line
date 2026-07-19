const fs = require('fs');
let content = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');

// Replace [db] with []
content = content.replace(/}, \[db\]\);/g, "}, []);");

// Replace collection(db, 'surf_calls') with collection(getDb(), 'surf_calls')
content = content.replace(/collection\(db, 'surf_calls'\)/g, "collection(getDb(), 'surf_calls')");

// Replace doc(db, 'surf_calls' with doc(getDb(), 'surf_calls'
content = content.replace(/doc\(db, 'surf_calls'/g, "doc(getDb(), 'surf_calls'");

fs.writeFileSync('src/contexts/DataContext.tsx', content);
