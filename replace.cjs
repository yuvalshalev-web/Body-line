const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir);

files.forEach(file => {
  if (file.endsWith('.tsx') && file !== 'DashboardPage.tsx') {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace exact matches
    content = content.replace(/className="main-page-title"/g, 'className="main-page-title surfer-title"');
    content = content.replace(/className="main-page-title m-0 relative z-10"/g, 'className="main-page-title surfer-title m-0 relative z-10"');
    
    fs.writeFileSync(filePath, content);
  }
});

console.log('Done replacing main-page-title');
