const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

content = content.replace(
  /const membersStats = getParticipationStats\(activeMembers.filter\(\(m: any\) => m.role === 'Member'\)\);/,
  `const membersStats = getParticipationStats(activeMembers.filter((m: any) => m.role === 'Member'));\n  const volunteersStats = getParticipationStats(activeMembers.filter((m: any) => m.role === 'Volunteer'));`
);

content = content.replace(
  /<StatBar label="חברים" stats=\{membersStats\} color="bg-slate-800" \/>/,
  `<StatBar label="משתתפים" stats={membersStats} color="bg-slate-800" />\n           <StatBar label="מתנדבים" stats={volunteersStats} color="bg-green-600" />`
);

content = content.replace(/חברים פעילים/g, "משתתפים ומתנדבים פעילים");
content = content.replace(/חברי הקהילה/g, "משתתפי ומתנדבי הקהילה");
content = content.replace(/event.type === 'INSTRUCTOR' \? 'מדריך' : 'חבר'/g, "event.type === 'INSTRUCTOR' ? 'מדריך' : event.type === 'VOLUNTEER' ? 'מתנדב' : 'משתתף'");
content = content.replace(/\{ id: 'USERS', label: 'חברים', icon: <Users size=\{20\} \/> \},/g, "{ id: 'USERS', label: 'משתמשים', icon: <Users size={20} /> },");

// Fix AdminPage create/edit member form
content = content.replace(/<option value="Member">חבר<\/option>/g, '<option value="Member">משתתף</option>\n                          <option value="Volunteer">מתנדב</option>');

fs.writeFileSync('src/pages/AdminPage.tsx', content);
