const fs = require('fs');
let content = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');

content = content.replace(
  "import { Link } from 'react-router-dom';",
  "import { Link } from 'react-router-dom';\nimport { SurfCallsWidget } from '../components/SurfCallsWidget';"
);

// We should inject it right after the outermost wrapper
// <div className="min-h-screen luxury-bg pb-20 overflow-hidden" dir="rtl">
content = content.replace(
  /<div className="min-h-screen luxury-bg pb-20 overflow-hidden" dir="rtl">/,
  `<div className="min-h-screen luxury-bg pb-20 overflow-hidden" dir="rtl">\n      <SurfCallsWidget />`
);

fs.writeFileSync('src/pages/HomePage.tsx', content);
