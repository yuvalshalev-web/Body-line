const fs = require('fs');
let content = fs.readFileSync('src/pages/EventsPage.tsx', 'utf8');

const filterLogic = `
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const roleFilteredEvents = sortedEvents.filter(e => {
    if (currentUser?.role === 'Admin') return true;
    if (e.type === 'COMMUNITY' || e.type === 'MEMBER') return true;
    if (e.type === 'INSTRUCTOR' && currentUser?.role === 'Instructor') return true;
    if (e.type === 'VOLUNTEER' && (currentUser?.role === 'Volunteer' || currentUser?.role === 'Instructor')) return true;
    return false;
  });
  const activeEvents = roleFilteredEvents.filter(e => !e.isArchived);
`;

content = content.replace(/const sortedEvents = \[\.\.\.events\].sort\(\(a, b\) => new Date\(a.date\).getTime\(\) - new Date\(b.date\).getTime\(\)\);\n  const activeEvents = sortedEvents.filter\(e => !e.isArchived\);/g, filterLogic);

// Add Volunteer option to event editor
content = content.replace(/<option value="MEMBER">חבר<\/option>/g, '<option value="MEMBER">משתתף</option>\n            <option value="VOLUNTEER">מתנדב</option>');
content = content.replace(/<option value="MEMBER">אירוע חברים<\/option>/g, '<option value="MEMBER">אירוע משתתפים</option>\n            <option value="VOLUNTEER">אירוע מתנדבים</option>');

fs.writeFileSync('src/pages/EventsPage.tsx', content);
