import fs from 'fs';
let code = fs.readFileSync('src/components/admin/EditMemberForm.tsx', 'utf-8');

code = code.replace(
  "X, Camera, UserCircle, ChevronLeft, Save, Archive, Loader2, Cake, Phone, Mail, ",
  "X, Camera, UserCircle, ChevronLeft, Save, Archive, Loader2, Cake, Phone, Mail, AlertCircle, "
);

fs.writeFileSync('src/components/admin/EditMemberForm.tsx', code, 'utf-8');
console.log('Fixed');
