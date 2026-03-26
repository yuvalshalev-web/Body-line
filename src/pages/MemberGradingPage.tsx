import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, User } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import MemberGradingModal from '../components/admin/MemberGradingModal';
import { Member } from '../types';

const MemberGradingPage: React.FC = () => {
  const { members } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filteredMembers = members.filter(m => 
    m.role !== 'Instructor' && 
    (m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     m.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black text-[#00426a] mb-6 uppercase tracking-widest">דף הערכות לחברים</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-gray-400" />
        <input 
          type="text" 
          placeholder="חיפוש חבר..." 
          className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 focus:ring-2 focus:ring-[#0071a1] outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredMembers.map(member => (
          <motion.div 
            key={member.id}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer text-center"
            onClick={() => setSelectedMember(member)}
          >
            {member.avatar ? (
              <img 
                src={member.avatar}
                alt={`${member.firstName} ${member.lastName}`}
                className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-indigo-50 flex items-center justify-center text-indigo-500">
                <User size={32} />
              </div>
            )}
            <h3 className="font-bold text-[#00426a]">{member.firstName} {member.lastName}</h3>
          </motion.div>
        ))}
      </div>

      {selectedMember && (
        <MemberGradingModal 
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          member={selectedMember}
        />
      )}
    </div>
  );
};

export default MemberGradingPage;
