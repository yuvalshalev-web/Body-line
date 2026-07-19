const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

// Add import
content = content.replace(
  "import AdminHelpPage from '../components/admin/AdminHelpPage';",
  "import AdminHelpPage from '../components/admin/AdminHelpPage';\nimport { SurfCallsAnalytics } from '../components/admin/SurfCallsAnalytics';"
);

// Add the case for the tab content
const newCase = `
        {activeTab === 'SURF_CALLS' && (
          <div className="max-w-6xl mx-auto">
            <SurfCallsAnalytics />
          </div>
        )}
`;

content = content.replace(
  "{activeTab === 'ASSETS' && (",
  newCase + "\n        {activeTab === 'ASSETS' && ("
);

fs.writeFileSync('src/pages/AdminPage.tsx', content);
