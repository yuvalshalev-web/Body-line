import fs from 'fs';
let css = fs.readFileSync('src/index.css', 'utf-8');

const replacements = [
  "  --vibrant-cyan: #3dbbd3;",
  "  --vibrant-cyan: #3dbbd3;\n  --surfer-vibrant-cyan: #3dbbd3;\n  --surfer-aqua-mist: #E0F2FE;\n  --surfer-electric-pink: #FF2D60;\n  --surfer-sunshine-yellow: #FFDE45;\n  --surfer-deep-magenta: #CC2678;\n  --surfer-turquoise-teal: #00ced1;"
];

css = css.replace(replacements[0], replacements[1]);
fs.writeFileSync('src/index.css', css, 'utf-8');
console.log('Fixed CSS');
