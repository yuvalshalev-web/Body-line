const fs = require('fs');
let content = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');

const targetStr = `      if (isSuperAdmin) {
        // Super Admin: Cycle through all roles
        if (member.role === 'Member') nextRole = 'Instructor';
        else if (member.role === 'Instructor') nextRole = 'Admin';
        else nextRole = 'Member';
      } else {
        // Regular Admin: Only toggle between Member and Instructor
        if (member.role === 'Admin') {
          throw new Error('Unauthorized: Only Super Admin can change Admin roles');
        }
        nextRole = member.role === 'Member' ? 'Instructor' : 'Member';
      }`;

const newStr = `      if (isSuperAdmin) {
        // Super Admin: Cycle through all roles
        if (member.role === 'Member') nextRole = 'Volunteer';
        else if (member.role === 'Volunteer') nextRole = 'Instructor';
        else if (member.role === 'Instructor') nextRole = 'Admin';
        else nextRole = 'Member';
      } else {
        // Regular Admin: Only toggle between Member, Volunteer and Instructor
        if (member.role === 'Admin') {
          throw new Error('Unauthorized: Only Super Admin can change Admin roles');
        }
        if (member.role === 'Member') nextRole = 'Volunteer';
        else if (member.role === 'Volunteer') nextRole = 'Instructor';
        else nextRole = 'Member';
      }`;

content = content.replace(targetStr, newStr);
fs.writeFileSync('src/contexts/DataContext.tsx', content);
