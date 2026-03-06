
import React from 'react';
import { UserCircle, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Member } from '../../types';

interface MemberTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onToggleStatus?: (member: Member) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isArchive?: boolean;
}

const MemberTable: React.FC<MemberTableProps> = ({ 
  members, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  isArchive = false 
}) => {
  const sortedMembers = [...members].sort((a, b) => {
    const aLast = a.lastName || '';
    const bLast = b.lastName || '';
    const aFirst = a.firstName || '';
    const bFirst = b.firstName || '';
    if (aLast || bLast) {
      const lastCompare = aLast.localeCompare(bLast, 'he');
      if (lastCompare !== 0) return lastCompare;
      return aFirst.localeCompare(bFirst, 'he');
    }
    return aFirst.localeCompare(bFirst, 'he');
  });

  return (
    <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-[rgba(255,255,255,0.05)] border-b border-[rgba(255,255,255,0.1)]">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-white/60 uppercase tracking-widest">
                {isArchive ? 'משתמש מושעה' : 'משתמש'}
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-white/60 uppercase tracking-widest">סטטוס</th>
              <th className="px-8 py-6 text-[10px] font-black text-white/60 uppercase tracking-widest text-center">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
            {sortedMembers.map(member => (
              <tr key={member.id} className="hover:bg-[rgba(255,255,255,0.05)] transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        className={`w-12 h-12 rounded-xl object-cover shadow-sm cursor-pointer hover:opacity-100 transition-opacity ${isArchive ? 'opacity-50' : ''}`} 
                        alt="" 
                        onClick={() => onEdit(member)}
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-xl bg-[#f7c1ea]/20 flex items-center justify-center text-[#f063c1]/20 cursor-pointer hover:bg-[#f7c1ea]/30 transition-colors"
                        onClick={() => onEdit(member)}
                      >
                        <UserCircle size={24} />
                      </div>
                    )}
                    <div>
                      <h4 className={`font-black ${isArchive ? 'text-[#f063c1]/40' : 'text-[#4a002e]'}`}>
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className={`text-[10px] font-black truncate max-w-[150px] ${isArchive ? 'text-[#f063c1]/20' : 'text-[#f063c1]/60'}`}>
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    isArchive ? 'bg-[#f7c1ea]/10 text-[#f063c1]/40' : 'bg-[#ff009f]/5 text-[#ff009f]'
                  }`}>
                    {member.role === 'Admin' ? 'מנהל' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(member)}
                      className="w-10 h-10 bg-white border border-[#ff009f]/10 rounded-xl flex items-center justify-center text-[#f063c1]/40 hover:text-[#ff009f] hover:border-[#ff009f]/30 hover:shadow-lg transition-all"
                      title="עריכה"
                    >
                      <Pencil size={18} />
                    </button>
                    {onToggleStatus && (
                      <button 
                        onClick={() => onToggleStatus(member)}
                        className={`w-10 h-10 bg-white border border-[#ff009f]/10 rounded-xl flex items-center justify-center transition-all hover:shadow-lg ${
                          isArchive ? 'text-emerald-500 hover:text-emerald-600' : 'text-rose-500 hover:text-rose-600'
                        }`}
                        title={isArchive ? 'החזר לפעילות' : 'העבר לארכיון'}
                      >
                        {isArchive ? <RotateCcw size={18} /> : <Trash2 size={18} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sortedMembers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-8 py-12 text-center text-[#f063c1]/40 font-black">אין משתמשים להצגה</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTable;
