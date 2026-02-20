
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search,
  Loader2,
  Check,
  X,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Copy,
  RotateCcw,
  MessageCircle,
  Trash2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { JoinRequest } from '../types';

const AdminPage: React.FC = () => {
  const { 
    joinRequests, siteAssets, approveRequest, rejectRequest 
  } = useData();

  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'SITE'>('REQUESTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [approvedUser, setApprovedUser] = useState<{ name: string; mobile: string; tempPassword: string } | null>(null);

  const filteredRequests = joinRequests.filter(req => 
    req.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    if (!window.confirm('האם לאשר את הצטרפות החבר/ה לנבחרת?')) return;
    setIsProcessing(id);
    try {
      const result = await approveRequest(id);
      if (result) {
        setApprovedUser(result);
      } else {
        alert('הבקשה כבר אינה קיימת או שאושרה על ידי מנהל אחר.');
      }
    } catch (err) {
      console.error(err);
      alert('שגיאה בתהליך האישור. בדוק את החיבור לאינטרנט.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('האם למחוק את בקשת ההצטרפות? כל הנתונים ימחקו לצמיתות מהמערכת.')) return;
    setIsProcessing(id);
    try {
      await rejectRequest(id);
    } catch (err) {
      console.error(err);
      alert('שגיאה במחיקת הבקשה.');
    } finally {
      setIsProcessing(null);
    }
  };

  const formatWhatsAppMessage = (name: string, tempPass: string) => {
    return `שלום ${name} , ברוך הבא לקהילת חבל זוג! \n\nחשבונך אושר בהצלחה. סיסמת הגישה הזמנית שלך היא: ${tempPass}\n\nמומלץ להיכנס בהקדם ולשנות את הסיסמה בפרופיל האישי.\nנתראה במים!`;
  };

  const openWhatsApp = (mobile: string, name: string, tempPass: string) => {
    const cleanMobile = mobile.replace(/\D/g, '');
    const finalMobile = cleanMobile.startsWith('0') ? '972' + cleanMobile.substring(1) : cleanMobile;
    const message = encodeURIComponent(formatWhatsAppMessage(name, tempPass));
    window.open(`https://wa.me/${finalMobile}?text=${message}`, '_blank');
  };

  return (
    <div className="relative min-h-screen bg-white text-right space-y-12 pb-20 pt-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full mb-4">
              <ShieldAlert size={12} className="text-rose-400" /> מנהל מערכת
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">ניהול בקשות הצטרפות</h2>
          </div>
          <div className="flex bg-slate-100 p-2 rounded-full gap-1">
            <button 
              onClick={() => setActiveTab('REQUESTS')}
              className={`px-8 py-3 rounded-full font-black text-xs transition-all ${activeTab === 'REQUESTS' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400'}`}
            >
              בקשות הצטרפות ({joinRequests.length})
            </button>
            <button 
              onClick={() => setActiveTab('SITE')}
              className={`px-8 py-3 rounded-full font-black text-xs transition-all ${activeTab === 'SITE' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400'}`}
            >
              הגדרות אתר
            </button>
          </div>
        </div>

        {activeTab === 'REQUESTS' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="relative">
               <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
               <input 
                 type="text" 
                 placeholder="חיפוש לפי שם או אימייל..." 
                 className="w-full pr-16 pl-6 py-6 bg-slate-50 rounded-[2.5rem] border-none font-black focus:ring-2 ring-slate-200 shadow-sm"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>

            {filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map(req => (
                  <div key={req.id} className={`bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full ${isProcessing === req.id ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-start gap-5 mb-8">
                       <img src={req.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                       <div>
                          <h4 className="text-xl font-black text-slate-900 mb-1">{req.name}</h4>
                          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                             <Calendar size={12} />
                             {new Date(req.requestedAt).toLocaleDateString('he-IL')}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 flex-1">
                       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <Mail size={14} className="text-slate-400" />
                          <span className="text-xs font-black truncate">{req.email}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <Phone size={14} className="text-slate-400" />
                          <span className="text-xs font-black">{req.mobile}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                          <MapPin size={14} />
                          <span className="text-xs font-black">{(req as any).group || 'הרצליה'}</span>
                       </div>
                    </div>

                    <div className="flex gap-3 mt-10">
                       <button 
                         onClick={() => handleApprove(req.id)}
                         disabled={isProcessing === req.id}
                         className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                         {isProcessing === req.id ? <Loader2 className="animate-spin" size={18} /> : <UserCheck size={18} />}
                         אשר הצטרפות
                       </button>
                       <button 
                         onClick={() => handleReject(req.id)}
                         disabled={isProcessing === req.id}
                         className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all disabled:opacity-50 flex items-center justify-center"
                         title="מחק בקשה"
                       >
                         {isProcessing === req.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[4rem]">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <UserCheck size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-400">אין בקשות הצטרפות ממתינות</h3>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 bg-white border border-slate-100 rounded-[4rem] p-12 shadow-sm">
             <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg"><RotateCcw size={24} /></div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900">הגדרות ונכסי אתר</h3>
                   <p className="text-slate-400 font-bold">צפייה בנכסים הוויזואליים של המערכת</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(siteAssets || {}).map(([key, value]: [string, any]) => (
                   <div key={key} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black text-[10px] uppercase shadow-sm">{key.slice(0, 2)}</div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</p>
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{typeof value === 'string' ? value : 'נתון מורכב'}</p>
                         </div>
                      </div>
                      <button className="p-2 text-slate-300 hover:text-slate-950 opacity-0 group-hover:opacity-100 transition-all"><ExternalLink size={16} /></button>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Success Modal for Approved Member */}
      {approvedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-10 md:p-14 text-center animate-in zoom-in-95 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                 <CheckCircle2 size={40} />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 mb-4">חבר/ה חדש/ה בנבחרת!</h3>
              <p className="text-slate-500 font-bold text-lg mb-10 leading-relaxed">
                הבקשה של <span className="text-emerald-600">{approvedUser.name}</span> אושרה.
                נא לשלוח לו/ה את פרטי הגישה:
              </p>
              
              <div className="bg-slate-50 rounded-[2rem] p-8 mb-6 border border-slate-100 relative group">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-right">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">טלפון</span>
                       <span className="font-black text-slate-900">{approvedUser.mobile}</span>
                    </div>
                    <div className="h-px bg-slate-200"></div>
                    <div className="flex justify-between items-center text-right">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סיסמה זמנית</span>
                       <span className="font-black text-emerald-600 text-xl tracking-wider select-all">{approvedUser.tempPassword}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-10">
                 <button 
                   onClick={() => openWhatsApp(approvedUser.mobile, approvedUser.name, approvedUser.tempPassword)}
                   className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                 >
                   <MessageCircle size={20} />
                   שלח בוואטסאפ
                 </button>
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(formatWhatsAppMessage(approvedUser.name, approvedUser.tempPassword));
                     alert('הודעת ההצטרפות הועתקה ללוח');
                   }}
                   className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                 >
                   <Copy size={18} />
                   העתק הודעה ללוח
                 </button>
              </div>
              
              <button 
                onClick={() => setApprovedUser(null)} 
                className="w-full py-5 bg-slate-950 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-slate-800 transition-all"
              >
                סגור פאנל
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
