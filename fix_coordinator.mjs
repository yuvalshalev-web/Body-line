import fs from 'fs';
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

code = code.replace(
  `member.role === 'Admin' \n                                ? 'bg-[var(--surfer-vibrant-cyan)]/10 text-[var(--surfer-vibrant-cyan)]'`,
  `(member.role === 'Admin' || member.role === 'Coordinator')\n                                ? 'bg-[var(--surfer-vibrant-cyan)]/10 text-[var(--surfer-vibrant-cyan)]'`
);

code = code.replace(
  `{member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : member.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}`,
  `{(member.role === 'Admin' || member.role === 'Coordinator') ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : member.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}`
);

fs.writeFileSync('src/pages/AdminPage.tsx', code, 'utf-8');
console.log('Fixed AdminPage');
