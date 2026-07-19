const fs = require('fs');
let content = fs.readFileSync('src/components/SurfCallsWidget.tsx', 'utf8');

if (!content.includes("import { motion }")) {
  content = content.replace(
    "import { SurfCall } from '../types';",
    "import { SurfCall } from '../types';\nimport { motion } from 'motion/react';"
  );
}

content = content.replace(
  '<div className="fixed bottom-24 left-6 z-50">',
  '<motion.div drag dragMomentum={false} className="fixed bottom-24 left-6 z-50 cursor-grab active:cursor-grabbing">'
);

content = content.replace(
  '        </button>\n      </div>',
  '        </button>\n      </motion.div>'
);

fs.writeFileSync('src/components/SurfCallsWidget.tsx', content);
