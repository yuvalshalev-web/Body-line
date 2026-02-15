
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { 
  User, 
  Mail, 
  ArrowRight, 
  Loader2, 
  Key, 
  Phone, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { auth } from '../services/firebase';

const LoginPage: React.FC = () => {
  const [view, setView] = useState<'LOGIN' | 'JOIN'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const GLOBAL_LOGO = "https://i.postimg.cc/Mp1vktm0/org-Logo-bbd1959c-cef4-4677-8c9d-a5943034a63e.png";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('פרטי הכניסה אינם נכונים או שהחשבון לא קיים');
      setIsLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // In a production app, we would add the request to a 'joinRequests' collection in Firestore
    setTimeout(() => {
      setSuccess('בקשתך התקבלה וממתינה לאישור מנהל. תקבל הודעה ברגע שהחשבון יופעל.');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-start overflow-x-hidden text-right font-['Assistant'] bg-white" dir="rtl">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-cyan-600 opacity-[0.03]"></div>
        <img src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=2000" alt="Surf" className="w-full h-full object-cover grayscale opacity-[0.04] scale-105" />
      </div>

      <div className="relative z-20 w-full max-w-xl px-4 py-20 flex-grow flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="bg-white/95 backdrop-blur-3xl border border-white rounded-[4rem] shadow-2xl overflow-hidden w-full">
          <div className="p-12 sm:p-20">
            <div className="text-center mb-16">
              <img src={GLOBAL_LOGO} alt="Logo" className="w-36 h-36 mx-auto object-contain mb-8" />
              <h1 className="text-6xl font-black text-slate-950 tracking-tighter">חבל זוג</h1>
              <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.5em] mt-4">
                {view === 'LOGIN' ? 'כניסת חברים' : 'הצטרפות לקהילה'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-sm font-bold mb-10 flex items-center gap-4">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center space-y-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto">
                  <CheckCircle2 size={48} />
                </div>
                <p className="text-2xl font-black text-slate-900 leading-tight">{success}</p>
                <button onClick={() => setSuccess('')} className="text-indigo-600 font-bold underline">חזרה לכניסה</button>
              </div>
            ) : (
              <form onSubmit={view === 'LOGIN' ? handleLoginSubmit : handleJoinSubmit} className="space-y-7">
                {view === 'JOIN' && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 pr-7 uppercase tracking-widest">שם מלא</label>
                    <input type="text" required className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-black text-slate-950 text-xl" value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 pr-7 uppercase tracking-widest">אימייל</label>
                  <input type="email" required className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-black text-slate-950 text-xl" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
                </div>

                {view === 'LOGIN' ? (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 pr-7 uppercase tracking-widest">סיסמה</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required className="w-full pr-8 pl-20 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-black text-slate-950 text-xl" value={password} onChange={e => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300">
                        {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 pr-7 uppercase tracking-widest">טלפון</label>
                    <input type="tel" required className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-black text-slate-950 text-xl" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="050-0000000" />
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-10">
                  <div className="flex items-center justify-center gap-6">
                    {isLoading ? <Loader2 className="animate-spin" size={32} /> : (view === 'LOGIN' ? 'כניסה למערכת' : 'שלח בקשה')}
                    {!isLoading && <ArrowRight size={30} className="rotate-180" />}
                  </div>
                </button>
                
                <div className="text-center pt-10 border-t border-slate-50 mt-12 flex flex-col gap-4">
                  <p className="text-lg font-bold text-slate-400">
                    {view === 'LOGIN' ? 'עדיין לא חלק מהנבחרת?' : 'כבר רשום במערכת?'} 
                  </p>
                  <button type="button" onClick={() => setView(view === 'LOGIN' ? 'JOIN' : 'LOGIN')} className="text-slate-950 font-black text-xl hover:text-indigo-600 transition-colors underline">
                    {view === 'LOGIN' ? 'הצטרפו אלינו לים 🏄' : 'חזרה לדף ההתחברות'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
