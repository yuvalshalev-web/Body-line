const fs = require('fs');
let content = fs.readFileSync('src/components/SurfCallsWidget.tsx', 'utf8');

// The missing </div> should be right before the comment section
content = content.replace(
  "{/* Comments Section */}",
  "</div>\n                          {/* Comments Section */}"
);

fs.writeFileSync('src/components/SurfCallsWidget.tsx', content);
