const fs = require('fs');
let content = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');

content = content.replace(
  "    </div>\n  );\n};\n\nexport default HomePage;",
  "      <SurfCallsWidget />\n    </div>\n  );\n};\n\nexport default HomePage;"
);

fs.writeFileSync('src/pages/HomePage.tsx', content);
