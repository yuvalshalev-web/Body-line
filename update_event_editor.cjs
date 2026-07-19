const fs = require('fs');
let content = fs.readFileSync('src/components/admin/EventEditor.tsx', 'utf8');

const targetStr = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">`;
const newStr = `
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block mr-1">קהל יעד / סוג אירוע</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all !text-slate-800 bg-white"
            >
              <option value="COMMUNITY">פתוח לכולם (קהילה)</option>
              <option value="MEMBER">משתתפי נבחרת בלבד</option>
              <option value="VOLUNTEER">מתנדבים, מדריכים ורכזים בלבד</option>
              <option value="INSTRUCTOR">מדריכים ורכזים בלבד</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
`;

content = content.replace(targetStr, newStr);

fs.writeFileSync('src/components/admin/EventEditor.tsx', content);
