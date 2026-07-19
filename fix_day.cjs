const fs = require('fs');
let content = fs.readFileSync('src/components/SurfCallsWidget.tsx', 'utf8');

content = content.replace(
  "    if (newCall.day === 'tomorrow') {\n      targetDate.setDate(targetDate.getDate() + 1);\n    }",
  "    if (newCall.day === 'tomorrow') {\n      targetDate.setDate(targetDate.getDate() + 1);\n    } else if (newCall.day === 'dayAfterTomorrow') {\n      targetDate.setDate(targetDate.getDate() + 2);\n    }"
);

content = content.replace(
  `                        <button
                          type="button"
                          onClick={() => setNewCall({ ...newCall, day: 'tomorrow' })}
                          className={\`flex-1 py-2 rounded-xl font-bold text-sm transition-all \${newCall.day === 'tomorrow' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}\`}
                        >
                          מחר
                        </button>`,
  `                        <button
                          type="button"
                          onClick={() => setNewCall({ ...newCall, day: 'tomorrow' })}
                          className={\`flex-1 py-2 rounded-xl font-bold text-sm transition-all \${newCall.day === 'tomorrow' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}\`}
                        >
                          מחר
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCall({ ...newCall, day: 'dayAfterTomorrow' })}
                          className={\`flex-1 py-2 rounded-xl font-bold text-sm transition-all \${newCall.day === 'dayAfterTomorrow' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}\`}
                        >
                          מחרתיים
                        </button>`
);

fs.writeFileSync('src/components/SurfCallsWidget.tsx', content);
