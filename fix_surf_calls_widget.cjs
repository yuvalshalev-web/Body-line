const fs = require('fs');
let content = fs.readFileSync('src/components/SurfCallsWidget.tsx', 'utf8');

// Remove SurfboardIcon
content = content.replace(
  /const SurfboardIcon[\s\S]*?\);\n\n/,
  ""
);

// Replace with emojis
content = content.replace(
  "<SurfboardIcon className=\"w-7 h-7 group-hover:animate-bounce\" />",
  "<span className=\"text-2xl group-hover:animate-bounce\" style={{ lineHeight: 1 }}>🏄‍♂️</span>"
);

content = content.replace(
  "<SurfboardIcon className=\"w-6 h-6 text-sky-500\" />",
  "<span className=\"text-xl\" style={{ lineHeight: 1 }}>🏄‍♂️</span>"
);

content = content.replace(
  "<SurfboardIcon className=\"w-12 h-12 mx-auto mb-4 opacity-20\" />",
  "<span className=\"text-5xl mx-auto mb-4 opacity-20 block\" style={{ lineHeight: 1 }}>🏄‍♂️</span>"
);

fs.writeFileSync('src/components/SurfCallsWidget.tsx', content);
