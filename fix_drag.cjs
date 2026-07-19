const fs = require('fs');
let content = fs.readFileSync('src/components/SurfCallsWidget.tsx', 'utf8');

content = content.replace(
  '<motion.div drag dragMomentum={false} className="fixed bottom-24 left-6 z-50 cursor-grab active:cursor-grabbing">',
  '<motion.div drag dragConstraints={{ left: 0, right: typeof window !== "undefined" ? window.innerWidth - 80 : 0, top: typeof window !== "undefined" ? -(window.innerHeight - 80) : 0, bottom: 0 }} dragMomentum={false} className="fixed bottom-24 left-6 z-50 cursor-grab active:cursor-grabbing">'
);

fs.writeFileSync('src/components/SurfCallsWidget.tsx', content);
