
import React, { useState } from 'react';
import { Search, UserCircle, Calendar, Mail, Phone, MapPin, UserCheck, UserX, Loader2 } from 'lucide-react';
import { JoinRequest } from '../../types';

interface JoinRequestManagerProps {
  requests: JoinRequest[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, name: string, mobile: string) => Promise<void>;
  isProcessing: string | null;
}

const JoinRequestManager: React.FC<JoinRequestManagerProps> = ({ 
  requests, 
  onApprove, 
  onReject, 
  isProcessing 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter(req => 
    req.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="relative">
        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-[#f063c1]/40" />
        <input 
          type="text" 
          placeholder="חיפוש לפי שם או אימייל..." 
          className="w-full pr-16 pl-6 py-6 bg-[#f7c1ea]/10 rounded-[2.5rem] border-none font-black focus:ring-2 ring-[#ff009f]/30 shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(req => (
            <div key={req.id} className={`glass-panel border border-white/20 rounded-[3rem] p-8 shadow-sm hover:shadow-xl hover:shadow-[#ff009f]/5 transition-all group flex flex-col h-full ${isProcessing === req.id ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-5 mb-8">
                {req.avatar ? (
                  <img src={req.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#f7c1ea]/20 flex items-center justify-center text-[#ff009f] shadow-md">
                    <UserCircle size={32} />
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-black text-[#4a002e] mb-1">{req.firstName} {req.lastName}</h4>
                  <div className="flex items-center gap-2 text-[#f063c1]/60 font-bold text-[10px] uppercase tracking-widest">
                    <Calendar size={12} />
                    {new Date(req.requestedAt).toLocaleDateString('he-IL')}
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 p-3 bg-[#f7c1ea]/10 rounded-xl">
                  <Mail size={14} className="text-[#f063c1]/60" />
                  <span className="text-xs font-black truncate">{req.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#f7c1ea]/10 rounded-xl">
                  <Phone size={14} className="text-[#f063c1]/60" />
                  <span className="text-xs font-black">{req.mobile}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#f063c1]/10 text-[#ff009f] rounded-xl">
                  <MapPin size={14} />
                  <span className="text-xs font-black">{(req as any).group || 'הרצליה'}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button 
                  onClick={() => onApprove(req.id)}
                  disabled={isProcessing === req.id}
                  className="flex-1 py-4 bg-[#ff009f] text-white rounded-2xl font-black text-sm hover:bg-[#4a002e] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {isProcessing === req.id ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} className="text-[#ffd2fa]" />}
                  אשר הצטרפות
                </button>
                <button 
                  onClick={() => onReject(req.id, `${req.firstName} ${req.lastName}`, req.mobile)}
                  disabled={isProcessing === req.id}
                  className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center border-2 border-rose-200 hover:border-rose-600 shadow-sm"
                  title="דחה ומחק בקשה"
                >
                  {isProcessing === req.id ? <Loader2 className="animate-spin" size={20} /> : <UserX size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed border-[#ff009f]/10 rounded-[4rem]">
          <div className="w-20 h-20 bg-[#f7c1ea]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#f063c1]/20">
            <UserCheck size={40} />
          </div>
          <h3 className="text-2xl font-black text-[#f063c1]/40">אין בקשות הצטרפות ממתינות</h3>
        </div>
      )}
    </div>
  );
};

export default JoinRequestManager;
