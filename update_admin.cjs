const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

const translateRole = (roleVar) => `${roleVar}.role === 'Admin' ? 'רכז' : ${roleVar}.role === 'Instructor' ? 'מדריך' : ${roleVar}.role === 'Volunteer' ? 'מתנדב' : 'משתתף'`;

content = content.replace(/member\.role === 'Admin' \? 'רכז' : member\.role === 'Instructor' \? 'מדריך' : 'חבר'/g, translateRole('member'));

content = content.replace(
/member\.role === 'Admin'\s*\?\s*'bg-purple-100 text-purple-700'\s*:\s*member\.role === 'Instructor'\s*\?\s*'bg-blue-100 text-blue-700'\s*:\s*'bg-slate-100 text-slate-700'/g,
`member.role === 'Admin' ? 'bg-purple-100 text-purple-700' : member.role === 'Instructor' ? 'bg-blue-100 text-blue-700' : member.role === 'Volunteer' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'`
);

content = content.replace(/ניהול חברים/g, "ניהול משתתפים ומתנדבים");
content = content.replace(/חברים רשומים/g, "משתתפים/מתנדבים");
content = content.replace(/ניהול ואישור חברים חדשים בקהילה/g, "ניהול ואישור חברים ומתנדבים חדשים בקהילה");
content = content.replace(/<h3 className="text-2xl font-black text-\[var\(--surfer-electric-pink\)\] tracking-tight">חברים<\/h3>/g, `<h3 className="text-2xl font-black text-[var(--surfer-electric-pink)] tracking-tight">משתתפים ומתנדבים</h3>`);
content = content.replace(/ניהול וסינון חברי הקהילה/g, "ניהול וסינון חברי הקהילה");
content = content.replace(/הוספת חבר/g, "הוספת משתמש");
content = content.replace(/ייבוא חברים/g, "ייבוא משתמשים");
content = content.replace(/<th className="px-8 py-6 text-\[12px\] font-black text-\[#000000\]\/60 uppercase tracking-widest">חבר<\/th>/g, `<th className="px-8 py-6 text-[12px] font-black text-[#000000]/60 uppercase tracking-widest">משתמש</th>`);
content = content.replace(/title="עריכת חבר"/g, `title="עריכת משתמש"`);

// "חבר/ה חדש/ה בנבחרת!" -> "משתתף/ת או מתנדב/ת חדש/ה בנבחרת!"
content = content.replace(/חבר\/ה חדש\/ה בנבחרת!/g, "משתתף/ת או מתנדב/ת חדש/ה בנבחרת!");

fs.writeFileSync('src/pages/AdminPage.tsx', content);
